import { useState, useEffect } from 'react';
import '../css/terminal.css';
import HackerSimulator from './HackSimulator';
const artStyle = {
  color: '#33FF57',
  whiteSpace: 'pre',
  fontFamily: 'monospace',
};
const terminalStyle = {
  color: '#FFFFFF',
  backgroundColor: '#2E2E2E',
  padding: '20px',
  borderRadius: '5px',
  whiteSpace: 'pre',
  fontFamily: 'monospace',
};
const Typewriter = (text, delay, func, Spinner, spinTime) => {
  const startTime = new Date();
  let Output = '';
  let index = 0;
  text = Spinner ? "⠋⠙⠹⠸⠼⠴⠦⠧⠇" : text;



  const intervalId = setInterval(() => {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        return clearInterval(intervalId);
      }
    });

    const endTime = new Date();
    if (index < text.length) {
      Output += text[index];
      index += 1;

      if (Spinner) {
        func(text[index]);
        setTimeout(function () {
          func(text[index + 1]);
        }, 700);
        if (index === 8) {
          if (endTime.getTime() - startTime.getTime() < spinTime) {
            index = 0;
          } else {
            clearInterval(intervalId);
          }
        }
      } else {
        func(Output);
      }
    } else {
      return clearInterval(intervalId);
    }
  }, delay);
};

// Move Terminal outside of Typewriter
function Terminal() {
  const [Text1, setText1] = useState('');
  const [Text2, setText2] = useState('');
  const [Text3, setText3] = useState('');
  const [Text4, setText4] = useState('');
  const cursor = '▮';
  let previousCommand;
  const [prevusedCommand, setprevusedCommand] = useState([]);

  function SkipIntro() {
    let id = setTimeout(() => { }, 0);
    while (id--) {
      clearTimeout(id);
    }

    id = setInterval(() => { }, 0);
    while (id--) {
      clearInterval(id);
    }
    setText1("ssh guest@vine.me");
    setText3("Access Granted!");
  }

  useEffect(() => {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        if (!Text3.includes("Access")) {
          let id = setTimeout(() => { }, 0);
          while (id--) {
            clearTimeout(id);
          }

          id = setInterval(() => { }, 0);
          while (id--) {
            clearInterval(id);
          }
          setText1("ssh guest@vine.me");
          setText2("guest@vine.me's password:");
          setText3("Access Granted!");
        }
        const CommandArea = document.getElementById("command");
        if (CommandArea) {
          previousCommand = CommandArea.value;
          setprevusedCommand((prevArray) => [...prevArray, "guest@vine.me:~$ " + previousCommand]);
          if (CommandArea.value === "github") {
            window.open("https://github.com/N1k0s1/vinyl-ysws-website", '_blank');
          } else if (CommandArea.value === "source") {
            window.open("https://github.com/N1k0s1/vinyl-ysws-website", '_blank');
          }
          CommandArea.value = "";
        }
      }
    });

    Typewriter("ssh guest@vine.me", 100, setText1);

    setTimeout(() => {
      setText2("guest@vine.me's password:▮");
    }, 3000);

    setTimeout(() => {
      Typewriter("", 100, setText4, true, 2500);
    }, 4300);

    setTimeout(() => {
      setText3("Connecting to guest@vine.me...");
    }, 4300);

    setTimeout(() => {
      setText2("guest@vine.me's password:");
      setText3("> Access granted.");
    }, 7300);
  }, []);

  return (
    <div className="terminal">
      <div className='console'>
        <span className='userPrefix'>user@vine:~$
          <span style={{ color: "white", marginLeft: "8px" }}>{Text1}{Text1.length === 20 ? "" : cursor}</span>
        </span>

        {Text3.includes("Access") ? "" : <span id='skipButton' onClick={SkipIntro}>Press Enter or Click Here to Skip</span>}
        {Text2}
        <span> {Text4} <span style={{ color: Text3.includes("Access") ? ("yellow") : "" }} >{Text3}</span></span>
        <br />
        {Text3.includes("Access") ? (
<pre>
{`
              _             _ ____       _       _            
       __   _(_)_ __  _   _| |  _ \\ _ __(_)_ __ | |_ ___ _ __ 
       \\ \\ / / | '_ \\| | | | | |_) | '__| | '_ \\| __/ _ \\ '__|
        \\ V /| | | | | |_| | |  __/| |  | | | | | ||  __/ |   
         \\_/ |_|_| |_|\\__, |_|_|   |_|  |_|_| |_|\\__\\___|_|   
                |___/                                   
`}
</pre>

) : null}

        {Text3.includes("Access") ? <span>Welcome! this project is currently under development.</span> : ""}
        {Text3.includes("Access") ? <span></span> : ""}<br />
        {Text3.includes("Access") ? <span><span style={{ color: "skyblue" }}>Available Commands:</span></span> : ""}
        {Text3.includes("Access") ? <span><span style={{ color: "#c9c9c9" }}>General: </span> about, hacksim, neofetch, clear</span> : ""}
        {Text3.includes("Access") ? <span><span style={{ color: "#c9c9c9" }}>Links:</span> github, source</span> : ""}

        <br></br>
        {Text3.includes("Access") ? <span>Thank you for visiting!◝(ᵔᵕᵔ)◜</span> : ""}
        <br></br>
        <ul className='previousCommands' id='console23'>
          {prevusedCommand.map((item, index) => {
            if (item.match(new RegExp(`\\b${"github"}\\b`, 'g'))) {
              return <li key={index}>{item}<br></br><br></br><span style={{ color: "#c9c9c9" }}>Opened GitHub https://github.com/N1k0s1/vinyl-ysws-website</span><br></br><br></br></li>;
            }

            else if (item.match(new RegExp(`\\b${"source"}\\b`, 'g'))) {
              return <li key={index}>{item}<br></br><br></br><span style={{ color: "#c9c9c9" }}>Opened the source code of this site in a new tab: https://github.com/N1k0s1/vinyl-ysws-website</span><br></br><br></br></li>;
            }
            else if (item.match(new RegExp(`\\b${"hacksim"}\\b`, 'g'))) {
              return <div><HackerSimulator></HackerSimulator><br></br>
                To abort, use aborthack
              </div>
            }
            else if (item.match(new RegExp(`\\b${"aborthack"}\\b`, 'g'))) {
              return <div key={index}><li>{item}</li>
                bash: {item.replace("guest@renisal.me:~$", '')}: ERROR - Script terminated by the user</div>;
            }
            else if (item.match(new RegExp(`\\b${"clear"}\\b`, 'g'))) {
              return setprevusedCommand([]);
            }
            else if (item.match(new RegExp(`\\b${"about"}\\b`, 'g'))) {
              return <div><li key={index}>{item}</li>
                <div className='aboutme'><br></br>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  <br></br><br></br>
                </div></div>
            }
             else if (item.match(new RegExp(`\\b${"neofetch"}\\b`, 'g'))) {
              return <div><li key={index}>{item}</li>
                <div className='neofetch'><br></br>
                <div style={{ display: 'flex' }}>
                {/* ASCII Art on the left */}
                <div style={artStyle}>
                  ⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣶⣾⣿⣿⣿⣿⣷⣶⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀<br />
                  ⠀⠀⠀⠀⠀⣠⢔⣫⢷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣄⠀⠀⠀⠀⠀<br />
                  ⠀⠀⣠⢊⡴⡫⢚⡽⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀<br />
                  ⠀⠀⡴⣱⢫⢎⡔⡩⣚⠵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀<br />
                  ⠀⣼⣽⣳⣣⢯⣞⡜⡱⣫⢷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀<br />
                  ⢸⣿⣿⣿⣿⣿⣿⣾⡽⣱⣫⠞⠉⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇<br />
                  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠃⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿<br />
                  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠘⠃⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿<br />
                  ⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⡿<br />
                  ⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣤⣀⣀⣀⣠⣴⢟⡵⣳⢯⢿⣿⡟⣿⣿⣿⣿⡇<br />
                  ⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣞⡵⣫⢏⢞⡽⡽⣻⢯⡟⠀<br />
                  ⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣚⢕⡡⢊⠜⡵⣣⠟⠀⠀<br />
                  ⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⢷⣫⢖⡥⢊⡴⠋⠀⠀⠀⠀⠀<br />
                  ⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣞⣭⠞⠋⠀⠀⠀⠀⠀⠀<br />
                  ⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠿⢿⣿⣿⣿⣿⡿⠿⠟⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀
                </div>

                {/* Terminal text on the right */}
                <div style={terminalStyle}>
                  <span style={{ color: "#33FF57" }}>guest@vine.me</span><br />
                  -------------------------<br />
                  <span style={{ color: "#33FF57" }}>OS:</span> Sonic Pi π<br />
                  <span style={{ color: "#33FF57" }}>Host:</span> Vine v1.0<br />
                  <span style={{ color: "#33FF57" }}>Kernel:</span> 6.1.0-21-amd64<br />
                  <span style={{ color: "#33FF57" }}>Uptime:</span> 21,373,712  mins<br />
                  <span style={{ color: "#33FF57" }}>Resolution:</span> 1920x1080<br />
                  <span style={{ color: "#33FF57" }}>DE:</span> GNOME 43.9 (wayland)<br />
                  <span style={{ color: "#33FF57" }}>WM:</span> Mutter<br />
                  <span style={{ color: "#33FF57" }}>Theme:</span> Adwaita [GTK2/3]<br />
                  <span style={{ color: "#33FF57" }}>Terminal:</span> gnome-terminal<br />
                  <span style={{ color: "#33FF57" }}>CPU:</span> Intel 80286 (1) @ 12.5MHz<br /><br />
                  
                  <span style={{color: "#FFFF00"}}>Fun fact!</span> Most climbing mishaps happen from exhaustion.<br />
                  Remember to take regular breaks!<br /><br />
                </div>
                </div>
                </div>
                </div>
            } else {
              return <div><li key={index}>{item}</li>
                bash: {item.replace("guest@renisal.me:~$", '')}: command not found</div>;
            }
          })}
        </ul>
        {Text3.includes("Access") ? <span className='commands'><span className='userPrefix'>guest@vine.me:~$</span> <input type="text" id="command" name="command" autoFocus></input></span> : ""}
      </div>
    </div>
  );
}
xw
  

export default Terminal;