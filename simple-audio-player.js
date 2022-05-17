function AudioPlayerContainer(audioEl){
    //TODO give some credits to https://css-tricks.com/lets-create-a-custom-audio-player
    
    const playerDoc = new DOMParser().parseFromString(`
        <div class="_audio-player-container">
            <button class="play-icon"><img src="play_icon.png"></button>
            <span class="current-time time">0:00</span>
            <input type="range" class="seek-slider" max="100" value="0">
            <span class="duration time">0:00</span>
            <div>
                <output class="volume-output">100</output>
                <input type="range" class="volume-slider" max="100" value="100">
                <button class="mute-icon"><img src="volume_icon.png"></button>
            </div>
        </div>
    `,'text/html');

    const audioPlayerContainer = playerDoc.body.children[0];

    const audio = {
        el: null,
        _time: null,
        _timeUpdateCallbacks: newCallbackSet(),
        updateTime: function(t){
            this.el.currentTime=t;
        },
        onTimeUpdate: function(id, callback){
            this._timeUpdateCallbacks.add(id, callback);
        },
        _volumeUpdateCallbacks: newCallbackSet(),
        setVolume: function(v){
            this.el.volume=v;
        },
        onVolumeSet: function(id, callback){
            this._volumeUpdateCallbacks.add(id, callback);
        },
        _readyCallbacks: newCallbackSet(),
        onReady: function(id,callback){
            this._readyCallbacks.add(id, callback)
        },
        _moreLoadedCallbacks: newCallbackSet(),
        onMoreLoaded: function(id, callback){
            this._moreLoadedCallbacks.add(id, callback);
        },
        play: function(){ this.el.play()},
        pause: function(){ this.el.pause()},
        mute: function(){ this.el.muted=true},
        unmute: function(){ this.el.muted=false},
        duration: function(){ return this.el.duration},
        getMaxBufferentAmount: function(){
            if(this.el.buffered.length>0){
                return Math.floor(this.el.buffered.end(this.el.buffered.length - 1));
            }
            return null;
        },
        currentTime: function(){
            return this.el.currentTime;
        },
        __init__: function(){
            window.addEventListener('DOMContentLoaded', () => {
                this.el = audioEl;
                if (this.el.readyState > 0) {
                    this._readyCallbacks.fire()
                } else {
                    this.el.addEventListener('loadedmetadata', () => {
                        this._readyCallbacks.fire()
                    });
                }
                this.el.addEventListener('progress', this._moreLoadedCallbacks.fire.bind(this._moreLoadedCallbacks));
                this.el.addEventListener('timeupdate', function() {
                    this._timeUpdateCallbacks.fire();
                }.bind(this));
            });
        },
    };
    audio.__init__();

    const seekSlider = {
        el: null,
        _isSliding: false,
        _sliderMovingCallback: newCallbackSet(),
        onSliderMoving: function(id, callback){
            this._sliderMovingCallback.add(id, callback);
        },
        __displayBufferedAmount__: function(){
            const maxBufferentAmount = audio.getMaxBufferentAmount();
            if(maxBufferentAmount != null){
                setProgressPercentage('--buffered-width', maxBufferentAmount, this.el.max)
            }
        },
        __init__: function(){
            audio.onReady("initSlider", ()=>{
                this.el.max = Math.floor(audio.duration());
            });
            audio.onReady("initBuffered", this.__displayBufferedAmount__.bind(this));
            audio.onMoreLoaded("updateBuffer", this.__displayBufferedAmount__.bind(this));
            audio.onTimeUpdate("updateTimeText", () => {
                if(!this._isSliding){
                    this.el.value = Math.floor(audio.currentTime());
                    this._sliderMovingCallback.fire(this.el.value);
                }
            });
            this.onSliderMoving("updateSliderCss", (value)=>{
                setProgressPercentageRange(this.el, '--seek-before-width');
            });
            window.addEventListener('DOMContentLoaded', (event) => {
                this.el = audioPlayerContainer.querySelector('.seek-slider');

                this.el.addEventListener('input', () => {
                    this._sliderMovingCallback.fire(this.el.value);
                });
                this.el.addEventListener('change', () => {
                    audio.updateTime(this.el.value);
                });
                setProgressPercentageRange(this.el, '--seek-before-width');

                this.el.addEventListener('mousedown', ()=> {
                    this._isSliding = true;
                });
                this.el.addEventListener('mouseup', ()=> {
                    this._isSliding = false;
                });
            });
        }
    };
    seekSlider.__init__();

    audio.onReady("initSong", ()=>{
        audioPlayerContainer.querySelector('.duration').textContent = formattedAudioDuration(audio.duration());
    });

    const currentTimeContainer = audioPlayerContainer.querySelector('.current-time');
    seekSlider.onSliderMoving("updateTimeText", function(value){
        currentTimeContainer.textContent = formattedAudioDuration(value);
    });

    initVolumeSlider();

    initButton("play-icon",[
        {name:"paused", image:"play_icon.png", callback: ()=> audio.pause()},
        {name:"playing", image:"pause_icon.png", callback: ()=> audio.play()}
    ]);

    initButton("mute-icon",[
        {name:"unmuted", image:"volume_icon.png", callback: ()=> audio.unmute()},
        {name:"muted", image:"mute_icon.png", callback: ()=> audio.mute()}
    ]);

    function setProgressPercentageRange(rangeInput, property) {
        setProgressPercentage(property, rangeInput.value, rangeInput.max);
    }
    function setProgressPercentage(property, value, max) {
        audioPlayerContainer.style.setProperty(property, value / max * 100 + '%');
    }


    function initVolumeSlider(){
        const volumeSlider = audioPlayerContainer.querySelector('.volume-slider');
        const volumeOutput = audioPlayerContainer.querySelector('.volume-output');

        setProgressPercentageRange(volumeSlider, '--volume-before-width');

        volumeSlider.addEventListener('input', (e) => {
            setProgressPercentageRange(volumeSlider, '--volume-before-width');
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const value = volumeSlider.value;

            volumeOutput.textContent = value;
            audio.setVolume(value / 100);
        });
    }
 
    function newCallbackSet(){
        return {
            _callbacks: {},
            fire: function(...values){
                for(callback of Object.values(this._callbacks)){
                    callback(...values);
                }
            },
            add: function(id, callback){
                this._callbacks[id]=callback;
            }
        };
    }
    
    function initButton(uniqueClass, states){
        /*states is an array with objects that contain:
            name: name of state
            image: image to show in the button for that state
            callback: callback to execute when button eneters that state
        */
        const buttonEl = audioPlayerContainer.querySelector('.' + uniqueClass);
        const imgsInButton = buttonEl.getElementsByTagName("img");
        if(imgsInButton.length!=1){
            throw "There should be just one image per button";
        }
        const imageEl = imgsInButton[0];
    
        buttonEl.dataset["state"] = states[0].name;
        imageEl.src = states[0].image;
    
        buttonEl.onclick = function(event){
            const currentStateIdx = states.findIndex(state => state.name == buttonEl.dataset["state"]);
            let nextState;
            if(currentStateIdx < states.length-1){
                nextState = states[currentStateIdx+1];
            } else {//current state = last state
                nextState = states[0];
            }
    
            buttonEl.dataset.state = nextState.name;
            imageEl.src = nextState.image;
            nextState.callback();
        }
    }
    
    function formattedAudioDuration(secs){
        var seconds = getSpareSeconds(secs);
        var minutes = minutesInSeconds(secs);
        seconds = seconds.toString().padStart(2,'0');
        return `${minutes}:${seconds}`;
    }
    function minutesInSeconds(secs){
        return Math.floor(secs / 60);
    }
    function getSpareSeconds(secs){
        return Math.floor(secs % 60);
    }


    return {
        create: function(){
            audioEl.after(audioPlayerContainer);
            audioEl.removeAttribute("controls");
            audioPlayerContainer.prepend(audioEl);
    }};
}
