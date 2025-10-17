function App() {
    const [isMuted, setIsMuted] = React.useState(false);
    const [volume, setVolume] = React.useState(0.5);
    const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);
    
    const toggleMute = () => {
        const newMuteState = toggleGameMute();
        setIsMuted(newMuteState);
    };

    const handleVolumeChange = (event) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        setGameVolume(newVolume);
    };

    // setTimeout(init, 1)
    return (<div>
    <canvas id="game-canvas" className="obj" width="100%" height="100%"></canvas>
    <a href="leaderboard.html"><div id="pause1" className="obj pause"></div></a>
    
    {/* Sound controls */}
    <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
    }}>
        {/* Volume slider (appears on hover) */}
        {showVolumeSlider && !isMuted && (
            <div style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '10px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{ color: 'white', fontSize: '12px' }}>Vol:</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ width: '80px' }}
                />
                <span style={{ color: 'white', fontSize: '12px' }}>{Math.round(volume * 100)}%</span>
            </div>
        )}
        
        {/* Mute/unmute button */}
        <button 
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
            style={{
                backgroundColor: isMuted ? '#ff4444' : '#44ff44',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    </div>

    {
    /* <div> 
    <button id="cog1" type="button" className="obj settings" onClick={screenLead}>
        <span className="button icon"><ion-icon name="cog-outline"></ion-icon></span>
    </button>
    </div>

    <div> <button id="play1" type="button" className="obj play"> <span className="button icon"><ion-icon name="play-outline"></ion-icon></span>
        </button>
    </div> */}

    </div>)
}
ReactDOM.render(<App />, document.querySelector('#app'))
var queue = init()

const BIRD_INTERVAL = 20
