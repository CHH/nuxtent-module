import prepPage from './page'

const { readdirSync, statSync } = require('fs')
const { join } = require('path')

export default function createDatabase (contentPath, dirName, options) {
  const dirPath = join(contentPath, dirName)
  const dirOpts = { ...options.content[dirName], parsers: options.parsers }

  const lazyPages = globAndApply(dirPath, new Map(),
    ({ fileName, section }, store ) => {
      const filePath = join(contentPath, dirName, section, fileName)
      const meta = { fileName, section, dirName, filePath }
      const lazyPage = prepPage(meta, dirOpts, options.isDev)
      store.set(lazyPage.permalink, lazyPage)
  })

  return {
    exists (permalink) {
      return lazyPages.has(permalink)
    },

    find (permalink) {
      return lazyPages.get(permalink).create()
    },

    findAll () { // TODO include or exclude? // TODO cache findAll if not in dev server
      return [ ...lazyPages.values() ].map(lazyPage => lazyPage.create())
    },

    query () { // TODO

    }
  }
}

function globAndApply (dirPath, fileStore,  applyFn, nestedPath = '/') {
  readdirSync(dirPath).forEach(stat => {
    const statPath = join(dirPath, stat)
    if(statSync(statPath).isFile()) {
      const fileData = { fileName: stat, section: nestedPath }
      applyFn(fileData, fileStore)
    } else globAndApply(statPath, fileStore, applyFn, join(nestedPath, stat))
  })
  return fileStore
}