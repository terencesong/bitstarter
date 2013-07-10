#!/usr/bin/env node
/*
Automatically grade files for the presence of the specified HTML
tags/attributes. Uses commander.js and cheerio. Teaches command line
application development and basic DOM parsing.

References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
    - http://en.wikipedia.org/wiki/JSON
    - https://developer.mozilla.org/en-US/docs/JSON
    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

*/


var fs = require('fs');
var util = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var HTMLURL_DEFAULT = "http://www.google.com";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
	console.log("%s does not exist. Existing.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var buildfn = function(inurl) {
    var response2console = function(result, response) {
	if (result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
	} else {
	    console.error("Read %s", inurl);
	    fs.writeFileSync("temp.html", result);
	}
    };
    return response2console;
};

var assertUrlExists = function(inurl) {
    var response2console = buildfn(inurl);
    rest.get(inurl).on('complete', response2console);
    return inurl;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {}
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to the HTML file', clone(assertFileExists))
	.option('-u, --url <url>', 'URL to the HTML file', clone(assertUrlExists))
	.parse(process.argv);
    var checkJson = undefined;
    if (program.file != undefined) {
	//console.log("Checking file: %s", program.file);
	checkJson = checkHtmlFile(program.file, program.checks);
    } else if (program.url != undefined) {
	//console.log("Checking URL: %s", program.url);
	checkJson = checkHtmlFile("temp.html", program.checks);
    } else {
	console.log("No HTML file or URL specified. Exiting.");
	process.exit(1);
    }
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    // Export checkHtmlFile so it can be called as a module.
    exports.checkHtmlFile = checkHtmlFile;
}
