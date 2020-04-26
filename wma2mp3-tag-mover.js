'use strict';

const readline = require('readline-sync');
const mm = require('music-metadata');
const util = require('util');
const NodeID3 = require('node-id3');


function processFiles() {
    let toConvertDragNDropFile = readline.question("MediaTag Transplanter:\n----------------------\nMake sure you converted all *.wma upfront to *.mp3 [Tip: use VLC for wma->mp3 conversion]\n(wma & mp3 next to each other).\n\nNow: Drag'n'Drop small portions of files you want to transplant from!\n\nWhen list is visible in terminal, confirm Enter/Return!\n");
    const START_PHRASE = ">>>"
    const END_PHRASE = "<<<"

    toConvertDragNDropFile = START_PHRASE+toConvertDragNDropFile+END_PHRASE;
    const fs = require('fs');

    const PATH_PREFIX = ""

    if((toConvertDragNDropFile.split("\"").length-1)%2 != 0) {
        console.log("Looks like you pulled in too many files, try less\nYou reached the max of the drag'n'drop cache.")    
        return;
    }

    toConvertDragNDropFile = toConvertDragNDropFile.split('\\').join('\\\\');
    toConvertDragNDropFile = toConvertDragNDropFile.split('" "').join('",\n"'+PATH_PREFIX);
    toConvertDragNDropFile = toConvertDragNDropFile.split(START_PHRASE+'"').join('["'+PATH_PREFIX);
    toConvertDragNDropFile = toConvertDragNDropFile.split('"'+END_PHRASE).join('"]')
    toConvertDragNDropFile = toConvertDragNDropFile.split('°').join('')

    let toConvertJson = toConvertDragNDropFile;

    const toConvert = JSON.parse(toConvertJson);

    toConvert.map((filepath) => {
        const buffer = fs.readFileSync(filepath)

        mm.parseFile(filepath)
            .then( metadata => {
                const song = metadata.common;
                
                let id3tag = {
                    TRCK: song.track, 
                    title: song.title, 
                    artist: song.artist, 
                    album: song.album, 
                    genre: song.genre,            
                }

                let foundCover = false;
                if(song.picture && song.picture[0].data) {
                    foundCover = true
                    const imgData = {
                        mime: song.picture.format,
                        type: {
                        id: 3,
                        name: "front cover"
                        },
                        description: song.picture.description,
                        imageBuffer: song.picture[0].data
                    }

                    id3tag = {...id3tag, image: imgData}
                }

                const mp3Filepath = filepath.replace(".wma", ".mp3");
                
                try {
                    if (fs.existsSync(mp3Filepath)) {
                        let success = NodeID3.update(id3tag, mp3Filepath)         
                        console.log("Processed: ",song.artist,"-", song.title,"Cover",foundCover," done:", success)
                    }
                } catch(err) {
                    console.error("File not found", mp3Filepath, err)
                }

            })
            .catch( err => {
                console.error(err.message);
            });
    })
}

processFiles()