# FE

> zero-configuration web server with built in pre-processing

### What is FE?

FE is a static web server that also serves Jade, Markdown, EJS, Less, Stylus, Sass, and CoffeeScript **as** HTML, CSS, and JavaScript without any configuration. It supports the beloved layout/partial paradigm and it has flexible metadata and global objects for traversing the file system and injecting custom data into templates. Optionally, FE can also compile your project down to static assets for hosting behind any valid HTTP server.

### Why?

Pre-compilers are becoming extremely powerful and shipping front-ends as static assets has many upsides. It's simple, it's easy to maintain, it's low risk, easy to scale, and requires low cognitive overhead. I wanted a lightweight web server that was powerful enough for me to abandon web frameworks for dead simple front-end publishing.

### Features

- easy installation, easy to use
- fast and lightweight
- robust (clean urls, intelligent path redirects)
- built in pre-processing
- first-class layout and partial support
- built in LRU caching in production mode
- can export assets to HTML/CSS/JS
- does not require a build steps or grunt task
- fun to use

### Supported Pre-Processors

|                 | Language Superset                                                 | Whitespace Sensitive
| --------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------
| **HTML**        | [EJS](http://embeddedjs.com/)                                     | [Jade](http://jade-lang.com/), [Markdown](http://daringfireball.net/projects/markdown/)
| **CSS**         | [LESS](http://lesscss.org/), [Sass (SCSS)](http://sass-lang.com/) | [Stylus](http://learnboost.github.io/stylus/), [Sass](http://sass-lang.com/)
| **JavaScript**  | (TBD)                                                             | [CoffeeScript](http://coffeescript.org/)

### Resources

- **Server Documentation** - [fe-serverjs.com/docs/](http://fe-serverjs.com/docs/)
- **Platform Documentation** - [fe-server.io/docs](https://fe-server.io/docs)
- **Source Code** - [github.com/sintaxi/fe-server](https://github.com/sintaxi/fe-server)


Authored and maintained by [@sintaxi](http://twitter.com/sintaxi). Made for the [@FEPlatform](http://twitter.com/FEPlatform).

---

### Installation

    sudo npm install -g fe-server

### Quick Start

Creating a new fe-server application is a breeze...

    fe-server init myproj
    fe-server server myproj

Your FE application is now running at [http://localhost:9000]()

---

## Documentation

FE can be used as a library or as a command line utility.

### CLI Usage

    Usage: fe-server [command] [options]

    Commands:

      init [path]                 initalize new fe-server application (defaults to current directory)
      server [path] [options]     start fe-server server
      compile [path] [options]    compile project to static assets
      multihost [path] [options]  start fe-server server to host directory of fe-server apps

    Options:

      -h, --help     output usage information
      -V, --version  output the version number

Start the server in root of your application by running...

    fe-server server

You may optionally supply a port to listen on...

    fe-server server --port 8002

Compile an application from the root of your application by running...

    fe-server compile

You may optionally pass in a path to where you want the compiled assets to go...

    fe-server compile --output /path/to/cordova/project/www

### Lib Usage

You may also use fe-server as a node library for compiling or running as a server.

Serve up a fe-server application...

```js
var fe-server = require("fe-server")
fe-server.server(projectPath [,args] [,callback])
```

**Or** compile fe-server application

```js
var fe-server = require("fe-server")
fe-server.compile(projectPath [,outputPath] [, callback])
```

**Or** use as Connect/ExpressJS middleware

```js
var express = require("express");
var fe-server = require("fe-server");
var app = express();
```

```js 
// Express 3
app.configure(function(){ 
  app.use(express.static(__dirname + "/public"));
  app.use(fe-server.mount(__dirname + "/public"));
});
```

```js 
// Express 4

app.use(express.static(__dirname + "/public"));
app.use(fe-server.mount(__dirname + "/public"));

```


## License

Copyright © 2012–2014 [Chloi Inc](http://chloi.io). All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
