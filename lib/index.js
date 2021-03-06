var path        = require('path')
var fs          = require('fs-extra')
var async       = require('async')
var connect     = require('connect')
var mime        = require('mime')
var terraform   = require('terraform')
var helpers     = require('./helpers')
var middleware  = require('./middleware')
var pkg         = require('../package.json')

require('colors');


/**
 * Server
 *
 * Host a single FE application.
 *
 */

exports.server = function (options, callback) {
  options = options || {}
  callback = callback || function() {}

  var host = options.host || '0.0.0.0'
  var port = options.port !== undefined ? options.port : 8080
  var root = options.root || process.cwd()
  var https = options.https || null
  var proxy = options.proxy || []

  // Setup a web server
  var app = connect();

  // Add middlewares
  [
      middleware.regProjectFinder(root)
    , middleware.setup
    , middleware.basicAuth
    , middleware.underscore
    , middleware.mwl
    , middleware.static
    , middleware.poly
    , middleware.process
    , middleware.serveIndex(root, { icons: true })
    , middleware.fallback
  ]
  .map(app.use.bind(app));

  var server, protocol;
  if (https !== null) {
    var httpsConfig = require(path.resolve(process.cwd(), https));
    server = require('https').createServer(httpsConfig, app);
    protocol = 'https';
  } else {
    server = require('http').createServer(app);
    protocol = 'http';
  }

  // Handle server startup errors
  server.on('error', function(e) {
    if (e.code === 'EADDRINUSE') {
      var serveURL = protocol + '://' + host + ':' + port
      console.log('%s is already in use. Trying another port.'.yellow, serveURL)
      setTimeout(function() { server.listen(0, host); }, 1000)
    } else {
      console.error(e.toString().red)
      server.close()
    }
  });

  server.on('listening', function() {
    var address = server.address()
    var serveHost = address.address === '0.0.0.0' ? '127.0.0.1' : address.address
    var serveURL = protocol + '://' + serveHost + ':' + address.port

    console.log('Your server is listening at %s'.green, serveURL)

    app.projectPath = root
    callback.apply(app, arguments)
  });

  // Setup server to listen at port
  server.listen(port, host);

  return server;
}


/**
 * Multihost
 *
 * Host multiple FE applications.
 *
 */

exports.multihost = function (dirPath, options, callback) {
  var app = connect()

  // Add middlewares
  [
      middleware.index(dirPath)
    , middleware.hostProjectFinder(dirPath)
    , middleware.setup
    , middleware.basicAuth
    , middleware.underscore
    , middleware.mwl
    , middleware.static
    , middleware.poly
    , middleware.process
    , middleware.fallback
  ]
  .map(app.use.bind(app));

  app.listen(options.port || 9000, callback)
}

/**
 * Mount
 *
 * Offer the asset pipeline as connect middleware
 *
 */

exports.mount = function (mountPoint, root) {

  if (!root) {
    root = mountPoint
    mountPoint = null
  } else {
    var rx = new RegExp('^' + mountPoint)
  }

  var finder = middleware.regProjectFinder(root)

  return function (req, rsp, next) {

    if (rx) {
      if (!req.url.match(rx)) return next()
      var originalUrl = req.url
      req.url         = req.url.replace(rx, '/')
    }

    finder(req, rsp, function () {
      middleware.setup(req, rsp, function () {
        middleware.static(req, rsp, function () {
          middleware.poly(req, rsp, function () {
            middleware.process(req, rsp, function () {
              if (originalUrl) req.url = originalUrl
              next()
            })
          })
        })
      })
    })
  }
}


/**
 * Pipeline
 *
 * Offer the asset pipeline as connect middleware
 *
 */

exports.pipeline = function (root) {

  console.log('Deprecated, please use MOUNT instead, this will be removed in a future version.');

  var publicPath = path.resolve(root)
  var terra = terraform.root(publicPath)

  return function (req, rsp, next) {
    var normalizedPath  = helpers.normalizeUrl(req.url)
    var priorityList    = terraform.helpers.buildPriorityList(normalizedPath)
    var sourceFile      = terraform.helpers.findFirstFile(publicPath, priorityList)

    if (!sourceFile) return next()

    terra.render(sourceFile, function (error, body) {
      if (error) return next(error)
      if (!body) return next() // 404

      var outputType = terraform.helpers.outputType(sourceFile)
      var mimeType   = helpers.mimeType(outputType)
      var charset    = mime.charsets.lookup(mimeType)
      rsp.statusCode = 200
      rsp.setHeader('Content-Type', mimeType + (charset ? '; charset=' + charset : ''))
      rsp.setHeader('Content-Length', Buffer.byteLength(body, charset));
      rsp.end(body)
    })

  }

}

exports.pkg = pkg

/**
 * Export middleware
 *
 * Make sure middleware is accessible
 * when using fe-server as a library
 *
 */
exports.middleware = middleware;

/**
 * Compile
 *
 * Compiles Single FE Application.
 *
 */

exports.compile = function (projectPath, outputPath, callback) {

  /**
   * Both projectPath and outputPath are optional
   */

  if (!callback) {
    callback   = outputPath
    outputPath = 'www'
  }

  if (!outputPath) {
    outputPath = 'www'
  }


  /**
   * Setup all the paths and collect all the data
   */

  try{
    outputPath = path.resolve(projectPath, outputPath)
    var setup  = helpers.setup(projectPath, 'production')
    var terra   = terraform.root(setup.publicPath, setup.config.globals)
  }catch(err) {
    return callback(err)
  }


  /**
   * Protect the user (as much as possible) from compiling up the tree
   * resulting in the project deleting its own source code.
   */

  if (!helpers.willAllow(projectPath, outputPath)) {
    return callback({
      type: 'Invalid Output Path',
      message: 'Output path cannot be greater then one level up from project path and must be in directory starting with `_` (underscore).',
      projectPath: projectPath,
      outputPath: outputPath
    })
  }


  /**
   * Compile and save file
   */

  var compileFile = function (file, done) {
    process.nextTick(function () {
      terra.render(file, function (error, body) {
        if (error) {
          done(error)
        } else {
          if (body) {
            var dest = path.resolve(outputPath, terraform.helpers.outputPath(file))
            fs.mkdirp(path.dirname(dest), function (err) {
              fs.writeFile(dest, body, done)
            })
          } else {
            done()
          }
        }
      })
    })
  }


  /**
   * Copy File
   *
   * TODO: reference ignore extensions from a terraform helper.
   */
  var copyFile = function (file, done) {
    var ext = path.extname(file)
    if (!terraform.helpers.shouldIgnore(file) && ['.jade', '.ejs', '.md', '.styl', '.less', '.scss', '.sass', '.js', '.coffee'].indexOf(ext) === -1) {
      var localPath = path.resolve(outputPath, file)
      fs.mkdirp(path.dirname(localPath), function (err) {
        fs.copy(path.resolve(setup.publicPath, file), localPath, done)
      })
    } else {
      done()
    }
  }

  /**
   * Scan dir, Compile Less and Jade, Copy the others
   */

  helpers.prime(outputPath, { ignore: projectPath }, function (err) {
    if (err) console.log(err)

    helpers.ls(setup.publicPath, function (err, results) {
      async.each(results, compileFile, function (err) {
        if (err) {
          callback(err)
        } else {
          async.each(results, copyFile, function (err) {
            setup.config['fe-server_version'] = pkg.version
            delete setup.config.globals
            callback(null, setup.config)
          })
        }
      })
    })
  })

}
