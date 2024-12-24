function Playing(artist, song) {
    this.artist = artist;
    this.song = song;
    this.isValid = artist !== null && artist !== '' && song !== null && song !== '';
    this.lyricsResult = null;
  }

// notifies subscribers of changes to the currently playing song
// users of this class must set activeChannelId
// might notify multiple times for same song (yagni)
// TODO: verify playing song is in time range on notify
export default class FipPlayingSongTracker {
    autoUpdateIntervalInMs = 6000
    updateTimeoutId = null
    observers = []
    _activeChannelId = null
    _lastFetchedPlayingJson = null
    _playing = undefined

    constructor(activeChannelId, isDevMode) {
        this._activeChannelId = activeChannelId
        this.isDevMode = isDevMode
    }

    set activeChannelId(activeChannelId) {
        if (this._activeChannelId === activeChannelId)
            return

        this._activeChannelId = activeChannelId
        this._playing = undefined
        this.notifySubscribers()
        this.start()
      }

      get activeChannelId() {
        return this._activeChannelId;
      }

    subscribe(observer) {
        this.observers.push(observer)
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(function(value, index, arr){ 
            return value !== observer;
        });
    }

    notifySubscribers() {
        let p = this._playing
        this.observers.forEach(o => o(p))
    }
    
    async start() {
        try {
            console.log("playingTracker::update() " + this.activeChannelId)

            // clear last timer that might still be active
            clearTimeout(this.updateTimeoutId)
            this.updateTimeoutId = null

            let playingJson = await this.fetchPlayingJson()
            if (playingJson === this._lastFetchedPlayingJson)
                return

            // TODO is valid check
            this._lastFetchedPlayingJson = playingJson

            this._playing = new Playing(playingJson?.now?.secondLine?.title, playingJson?.now?.firstLine?.title)
            // console.log(this._playing, playingJson);
    
            this.notifySubscribers()
        } catch (error) {
            console.log(error)
        } finally {
            if (this.updateTimeoutId === null) {
                this.updateTimeoutId = setTimeout(() => this.start(), this.autoUpdateIntervalInMs)
                console.log('next update scheduled in finally in ' + this.autoUpdateIntervalInMs / 1000 + ' seconds')
            }
        }
    }

    async fetchPlayingJson() {
        console.log('fetching data')
        let url = 
            this.isDevMode 
            ? new URL("https://www.radiofrance.fr/fip/api/live")
            : new URL("/latest/api", window.location.href)

        // console.log("this._activeChannelId", this._activeChannelId, this._stationApiIdFromChannelId(this._activeChannelId), this,this._channelIdToApiId);
        url.searchParams.set("webradio", this._stationApiIdFromChannelId(this._activeChannelId))

        let response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            }
        })

        if (!response)
            throw Error(`empty fetch response for url=${url}`)

        return await response.json()
    }

    _channelIdToApiId = new Map([
        [7, 'fip'],
        [64, 'fip_rock'],
        [65, 'fip_jazz'],
        [66, 'fip_groove'],
        [78, 'fip_pop'],
        [74, 'fip_electro'],
        [69, 'fip_monde'],
        [71, 'fip_reggae'],
        [70, 'fip_nouveautes'],
        [77, 'fip_metal'],
        [98, 'fip_hiphop'],
        [99, 'fip_sacre_francais'],
    ])
    _stationApiIdFromChannelId(id) {
        return this._channelIdToApiId.get(id)
    }

}
