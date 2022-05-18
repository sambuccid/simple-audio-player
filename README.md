# simple-audio-player
This project is a simple library that contains a cross-browser audio audio player.

The audio player aims at being basic and simple, this makes it an audio player easy to hack and customize.

## How does it look:
![Simple Audio Player](Simple_Audio_Player.png?raw=true)


## How to use it:
To use the player all you need to do is
* download the project
* copy all the files in your website
* import `simple-audio-player.css` in your webpage
* import `simple-audio-player.js` in your webpage
* initialize the player like this `AudioPlayerContainer(audioElement).create();`

To view an example of how to do it and how it looks have look at the [Demo](demo.html) page

### Code required
Once you downloaded the repository and you made sure you copied all the files in the right place in your project you are ready to start using the player.
You can also use the library without using a server by just opening the html pages from your browser.

So first of all we need to include the css file that defines the style of the player, to do this add to your header in your page
```
<link rel="stylesheet" href="simple-audio-player.css">
```

Next step is to include the js file to make the actual player work
```
<script src="simple-audio-player.js"></script>
```

At this point you want to have an `audio` element in your page that will then be transformed into the audio player, the element will define things like which audio to play, the element looks like this
```
<audio controls id="audio" src="https://freepd.com/music/Advertime.mp3" preload="metadata"></audio>
```

We are at the last step, where all we need to do is to tell the library which element in your page should become the player, in order to do this we need to add some javascript
```
var audioElement = document.getElementById("audio");
AudioPlayerContainer(audioElement).create();
```

And that's all, you now have your simple player in your webpage


## Contributions
This player aims to be really simple and basic but even if there aren't plans to expand, bug reports are very welcome so please create a new issue on github whenever you find a problem with the player

## Credits
The project started following this article from css-tricks [Lets create an audio player](https://css-tricks.com/lets-create-a-custom-audio-player)
