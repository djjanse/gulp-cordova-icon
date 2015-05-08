#!/usr/bin/env node
'use strict';

/**
 * This hook is ran before the build proces and generates all the icons
 * for the platform that is being build.
 *
 * @author Sam Verschueren
 * @since  7 May 2015
 */

// module dependencies
var path = require('path'),
    fs = require('fs'),
    gm = require('gm'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    et = require('elementtree');

// variables
var platforms = require('../platforms.json'),
    platform = platforms[process.env.CORDOVA_PLATFORMS];

if(!platform) {
    // Exit if the platform could not be found
    return 0;
}

/**
 * Loads the project name from the config.xml file.
 *
 * @param {Function} callback Called when the name is retrieved.
 */
function loadProjectName(callback) {
    try {
        var contents = fs.readFileSync(path.join(__dirname, '../../config.xml'), 'utf-8');
        if(contents) {
            //Windows is the BOM. Skip the Byte Order Mark.
            contents = contents.substring(contents.indexOf('<'));
        }

        var doc = new et.ElementTree(et.XML(contents)),
            root = doc.getroot();

        if(root.tag !== 'widget') {
            throw new Error('config.xml has incorrect root node name (expected "widget", was "' + root.tag + '")');
        }

        var tag = root.find('./name');

        if(!tag) {
            throw new Error('config.xml has no name tag.');
        }

        callback(tag.text);
    }
    catch (e) {
        console.error('Could not loading config.xml');
        throw e;
    }
}

/**
 * Generates all the icons for the platform that is being build.
 *
 * @param  {Function} done Called when all the icons are generated.
 */
function generate(done) {
    loadProjectName(function(name) {
        var root = path.join(process.env.PWD, 'platforms', process.env.CORDOVA_PLATFORMS, platform.root.replace('{appName}', name));

        async.each(platform.icons, function(icon, next) {
            var dest = path.join(root, icon.file);

            if(!fs.existsSync(path.dirname(dest))) {
                mkdirp.sync(path.dirname(dest));
            }

            gm(path.join(__dirname, '../../res/icon.png')).resize(icon.dimension, icon.dimension).write(dest, next);
        }, done);
    });
}

// Start generating
return generate(function() {
    // Just exit, regarding of what happened
    return 0;
});
