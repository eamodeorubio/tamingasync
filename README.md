Description
===

This project contains the slides for my talk about asynchronous programming
with JS and the code samples.

If you want to play with the code, download this project and follow the build
 instructions.

You can change the port the server is listening

Build
====

* [Install MongoDB](http://docs.mongodb.org/manual/installation/) if you already don't have it.
* [Install NodeJS](http://nodejs.org/) if you already don't have it (at least 0.8,
but I recommend latest stable version).
* Install Grunt 0.4 `npm install -g grunt-cli` if you already don't have it.
* Change to the `code/` directory and issue `npm install` command.
* Change to the `code/lib/es` directory and issue `npm install` command in
that directory.
* Go back to `code/` and issue `grunt` command.

Installing and starting the sample DB
===

* Change to the `code/` directory
* Unpack `db/sampledb.zip`. A `sampledb/` directory should appear under `db/`
* From `code/` start mongo with `mongod --dbpath db/sampledb/`

Starting the server
===

* From `code/` issue `node lib/server.js` to start the server
* You can access the UI in the following URLs: `http://localhost:8081/frp
.html`, `http://localhost:8081/es
.html`,
`http://localhost:8081/fp.html` and `http://localhost:8081/rx.html`
* Each URI is the same application but implemented with different approaches
* Try to search for `red`, `shoe`, `bag`, `white`, etc.

Custom settings
===

* Change the file `config/settings.json` and restart the server
* This file contains the configuration for the server:

```json
{
  "dbString":"mongodb://[user:password]@localhost:[port]/sample?w=1",
  "port":[the port nodejs server is listening to],
  "delay":[a delay in milliseconds to emulate network latency, must be > 1]
}
```

