// var url = '10.3.32.120:3001/'
// var url = '10.14.143.103:3001/'
var url = 'localhost:3001/'
var get_path = 'leaderboard'
class App extends React.Component{
    constructor(props) {
        super(props)
        this.state = {
            // values: [{"IP":"127.0.0.1","score":230},{"IP":"10.1.0.5","score":100},{"IP":"0.0.0.0","score":70},{"IP":"9.0.0.1","score":7}]
            values: []
        }
        fetch(`http://${url+get_path}`, {
            method: "get",
            // body: 12
        }).then(
            res=>{
                console.log(res)
                let out = res.text()
                out.then(val=>{
                    console.log("Conversion succeeded:", val)
                })
                .catch(err=>{
                    console.log('Consversion failed:', err)
                })
                return out
            }
        ).then(val=>{
            console.log('Received response:', val)
            // let x = JSON.parse(`[${val.toString()}]`)
            // console.log(x)
            // let new_val = val.map(v=>{
            //     let ip = v["IP"];
                    
            // })
            this.setState({
                values: JSON.parse(val)
                //values: [{"IP":"127.0.0.1","score":230},{"IP":"10.1.0.5","score":100},{"IP":"0.0.0.0","score":70},{"IP":"9.0.0.1","score":7}]
            })
            // Play a success sound when leaderboard loads
            if (typeof playPointSound === 'function') {
                setTimeout(() => playPointSound(), 200); // Slight delay for better UX
            }
        })
        console.log("SENT REQUEST")
    }
    render() {
        var i = 0;
        let tstyle = {border: "3px solid black",borderRadius: '10px', margin: "0px", padding: "0px", textAlign:'center', margin:'100px auto auto auto', padding:'17.5px', fontSize:'25px',fontFamily: "Times New Roman"}
        let tstyle2= {border: "0px solid black",borderRadius: '10px', margin: "0px", padding: "0px", textAlign:'center', margin:'100px auto auto auto', padding:'17.5px', fontSize:'25px',fontFamily: "Times New Roman"}
        let list = this.state.values.map(x=>{
            i++
            return <tr style={tstyle} key={i}><td style={tstyle}>{x.IP}</td><td style={tstyle}>{x.score}</td></tr>
        })
        return <div style={{backgroundImage: 'url(/Sprites/BG.png)', backgroundSize: "contain", height: screen.height, margin: 0, textAlign:"center"}}>
            <button style={{backgroundColor: "#e56400", fontSize:'50px',fontFamily: "Times New Roman", borderRadius:'10px'}}><a href="/" style={{backgroundColor: "#e56400", textDecoration: "", fontSize:'50px',fontFamily: "Times New Roman", borderRadius:'10px'}}>PLAY AGAIN</a></button>
        
            <table style={tstyle2}>
            <tbody>
                <th>IP</th><th>hi score</th>
                {list}
            </tbody>
            </table>
        </div>
    }
}

console.log(document.querySelector('#table'))
ReactDOM.render(<App/>, document.querySelector('#table'))
