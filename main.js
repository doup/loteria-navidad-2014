var colors  = require('colors');
var play    = require('play');
var request = require('request');
var q       = require('q');

var nums   = require('./numeros.json');
var prizes = [];
var wait   = 30 * 1000;

function parseBody(res) {
    return JSON.parse(res.body.replace('busqueda=', ''));
}

function check(num) {
    var deferred = q.defer();

    console.log(('Checking #'+ num +'…').grey);

    request.get('http://api.elpais.com/ws/LoteriaNavidadPremiados?n='+ num, function (err, res) {
        if (err) {
            deferred.reject();
        } else {
            deferred.resolve(parseBody(res));
        }
    });

    return deferred.promise;
}

function checkPrices() {
    var checks = [];
    var i;

    console.log('----'.grey);

    for (i = 0; i < nums.length; i++) {
        checks.push(check(nums[i]));
    }

    q.all(checks).then(function (results) {
        for (i = 0; i < results.length; i++) {
            if (results[i].premio !== 0) {
                if (prizes.indexOf(results[i].numero) === -1) {
                    play.sound('fanfare.wav');
                }

                console.log(('PREEEEEEMIIOOO!!! #'+ results[i].numero +' => '+ results[i].premio).rainbow);
                prizes.push(results[i].numero.toString());
            } else {
                console.log(('#'+ results[i].numero +' nada por ahora.').grey);
            }
        }

        if (results[0].status !== 3) {
            setTimeout(checkPrices, wait);
        } else {
            if (prizes.length) {
                console.log(('THERE ARE PRIZES FOR: '+ prizes.join(' ')).rainbow);
                play.sound('fanfare.wav');
            } else {
                console.log('No prizes :-('.red);
                play.sound('pacman_death.wav');
            }
        }
    });
}

checkPrices();
