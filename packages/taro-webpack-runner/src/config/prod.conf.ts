import * as path from 'path'
import { get, mapValues, merge } from 'lodash'

import { addTrailingSlash, emptyObj } from '../util'
import {
  getCopyWebpackPlugin,
  getCssoWebpackPlugin,
  getDefinePlugin,
  getDevtool,
  getHtmlWebpackPlugin,
  getMiniCssExtractPlugin,
  getMainPlugin,
  getModule,
  getOutput,
  processEnvOption
} from '../util/chain'
import { BuildConfig } from '../util/types'

export default function (appPath: string, config: Partial<BuildConfig>, chain: any): any {
  const {
    alias = emptyObj,
    copy,
    entry = emptyObj,
    entryFileName = 'app',
    output = emptyObj,
    sourceRoot = '',
    outputRoot = 'dist',
    publicPath = '',
    staticDirectory = 'static',
    chunkDirectory = 'chunk',
    router = emptyObj,

    designWidth = 750,
    deviceRatio,
    enableSourceMap = false,
    enableExtract = true,

    defineConstants = emptyObj,
    env = emptyObj,
    styleLoaderOption = emptyObj,
    cssLoaderOption = emptyObj,
    mediaUrlLoaderOption = emptyObj,
    fontUrlLoaderOption = emptyObj,
    imageUrlLoaderOption = emptyObj,

    miniCssExtractPluginOption = emptyObj,
    esnextModules = [],

    postcss,
    csso
  } = config
  const sourceDir = path.join(appPath, sourceRoot)
  const outputDir = path.join(appPath, outputRoot)
  const isMultiRouterMode = get(router, 'mode') === 'multi'

  const plugin: any = {}

  plugin.mainPlugin = getMainPlugin({
    framework: config.framework,
    entryFileName,
    sourceDir,
    outputDir,
    routerConfig: router
  })

  if (enableExtract) {
    plugin.miniCssExtractPlugin = getMiniCssExtractPlugin([
      {
        filename: 'css/[name].css',
        chunkFilename: 'css/[name].css'
      },
      miniCssExtractPluginOption
    ])
  }

  if (copy) {
    plugin.copyWebpackPlugin = getCopyWebpackPlugin({ copy, appPath })
  }

  if (isMultiRouterMode) {
    merge(plugin, mapValues(entry, (filePath, entryName) => {
      return getHtmlWebpackPlugin([{
        filename: `${entryName}.html`,
        template: path.join(appPath, sourceRoot, 'index.html'),
        chunks: [entryName]
      }])
    }))
  } else {
    plugin.htmlWebpackPlugin = getHtmlWebpackPlugin([{
      filename: 'index.html',
      template: path.join(appPath, sourceRoot, 'index.html')
    }])
  }

  plugin.definePlugin = getDefinePlugin([processEnvOption(env), defineConstants])

  const isCssoEnabled = !(csso && csso.enable === false)

  if (isCssoEnabled) {
    plugin.cssoWebpackPlugin = getCssoWebpackPlugin([csso ? csso.config : {}])
  }

  const mode = 'production'

  const minimizer: any[] = []

  alias['@tarojs/components$'] = `@tarojs/components/h5/${config.framework === 'vue' ? 'vue' : 'react'}`

  if (config.framework === 'vue') {
    const VueLoaderPlugin = require('vue-loader/lib/plugin')
    plugin.vueLoaderPlugin = {
      plugin: new VueLoaderPlugin()
    }
  }

  return {
    mode,
    devtool: getDevtool(enableSourceMap),
    entry,
    output: getOutput(appPath, [{
      outputRoot,
      publicPath: addTrailingSlash(publicPath),
      chunkDirectory
    }, output]),
    resolve: { alias },
    module: getModule(appPath, {
      designWidth,
      deviceRatio,
      enableExtract,
      enableSourceMap,

      styleLoaderOption,
      cssLoaderOption,
      fontUrlLoaderOption,
      imageUrlLoaderOption,
      mediaUrlLoaderOption,
      esnextModules,

      postcss,
      staticDirectory,
      framework: config.framework
    }, chain),
    plugin,
    optimization: {
      minimizer,
      splitChunks: {
        name: false
      }
    }
  }
}
