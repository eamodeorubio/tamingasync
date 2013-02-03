module.exports = function (grunt) {
  grunt.initConfig({
    browserify:{
      "lib/www/js/es/main.js":{
        entries:['lib/es/main.js']
      }
    },
    min:{
      fp:{
        src:['lib/www/js/fp/tools.js', 'lib/www/js/fp/main.js'],
        dest:'lib/www/js/fp/app.min.js'
      },
      frp:{
        src:['lib/www/js/frp/bacon.min.js', 'lib/www/js/frp/main.js'],
        dest:'lib/www/js/frp/app.min.js'
      },
      bfrp:{
        src:['lib/www/js/frp/bacon.min.js'],
        dest:'lib/www/js/frp/b.min.js'
      },

      rx:{
        src:[
          'lib/www/js/rx/framework/rx.min.js',
          'lib/www/js/rx/framework/rx.time.min.js',
          'lib/www/js/rx/framework/rx.jquery.js',
          'lib/www/js/rx/main.js'
        ],
        dest:'lib/www/js/rx/app.min.js'
      },
      es:{
        src:['lib/www/js/es/main.js'],
        dest:'lib/www/js/es/app.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', 'browserify min');
};