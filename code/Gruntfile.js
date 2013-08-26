module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      es: {
        files: {
          'lib/www/js/es/main.js': ['lib/es/main.js']
        }
      }
    },
    uglify: {
      options: {
        mangle: {
          except: ['jQuery', 'Zepto', '$', 'liveSearch', 'fpToolkit']
        },
        report: 'gzip'
      },
      fp: {
        files: {
          'lib/www/js/fp/app.min.js': [
            'lib/www/js/fp/tools.js',
            'lib/www/js/fp/main.js'
          ]
        }
      },
      frp: {
        files: {
          'lib/www/js/frp/app.min.js': [
            'lib/www/js/frp/bacon.min.js',
            'lib/www/js/frp/main.js'
          ]
        }
      },
      rx: {
        files: {
          'lib/www/js/rx/app.min.js': [
            'lib/www/js/rx/framework/rx.min.js',
            'lib/www/js/rx/framework/rx.time.min.js',
            'lib/www/js/rx/framework/rx.jquery.js',
            'lib/www/js/rx/main.js'
          ]}
      },
      es: {
        files: {
          'lib/www/js/es/app.min.js': ['lib/www/js/es/main.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['browserify', 'uglify']);
};