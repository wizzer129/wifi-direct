const { exec } = require('child_process');

// Function to execute wpa_cli commands
function runWpaCliCommand(command, callback) {
  exec(`wpa_cli ${command}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    callback(stdout);
  });
}

// Example function to start WiFi Direct
function startWifiDirect() {
  runWpaCliCommand('-ip2p-dev-wlan0 p2p_find', (output) => {
    console.log(`Output: ${output}`);
  });
}

// Example function to connect to a peer
function connectToPeer(peerAddress) {
  runWpaCliCommand(`p2p_connect ${peerAddress} pbc`, (output) => {
    console.log(`Output: ${output}`);
  });
}

// Start WiFi Direct
startWifiDirect();

// Connect to a peer (replace 'peerAddress' with the actual peer address)
// connectToPeer('peerAddress');
// sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT

// for i in $( wpa_cli -i p2p-dev-wlan0 p2p_peers ); do echo -n "$i "; wpa_cli -i p2p-dev-wlan0 p2p_peer $i | grep device_name=; done
// wpa_cli -i p2p-dev-wlan0 p2p_connect 82:07:94:e4:24:81 pin auth

// Create group

// wpa_cli -i p2p-dev-wlan0 p2p_group_add
// wpa_cli p2p_invite group=p2p-wlan0-0 peer=82:07:94:e4:24:81
// wpa_cli -i p2p-dev-wlan0 p2p_connect 82:07:94:e4:24:81 pin auth
// wpa_cli p2p_connect 82:07:94:e4:24:81 pin display

// wpa_cli p2p_connect 82:07:94:e4:24:81 pin 12345670

// wpa_cli p2p_group p2p-wlan0-0

// finish connection
// ip -br link | grep -Po 'p2p-wlan0-\d+' # get results


// systemctl restart NetworkManager
// systemctl restart wpa_supplicant