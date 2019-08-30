/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var m_console; // console of uav status
var points_pub;
var uav_num = 10; //number of drones
var google_map; //map instance
var pathOpacity = 1.0; // path opacity
var pathWeight = 2; //path width
var pathColor = ["#ffff00","#ff0000","#ff8000",  "#80ff00", "#00ff80",
"#00ffff", "#0000ff", "	#8000ff", "	#ff00bf", "	#ff0040"]; //path color
var markers = []; //Google map markers
var Blackmore_Lat_Lon = {lat: 1.32854998112, lng: 103.786003113};
var Tuas_Lat_Lon = {lat: 1.266500, lng: 103.640000};
var img_IP;

var errorState = [
    "Roll Error",      // 0: roll, 1: pitch
    "Pitch Error",
    "Mag N Error",     // 2: magN, 3: magE, 4: magD
    "Mag E Error",
    "Mag Z Error",
    "Acc N Error",     // 5: accN, 6: accE, 7: accD
    "Acc E Error",
    "Acc Z Error",
    "Eph Error",       // 8: eph, 9: epv, 10: velN, 11: velE, 12: velD, 13: gpsT
    "Epv Error",
    "GPS Vel N Error",
    "GPS Vel E Error",
    "GPS Vel D Error",
    "GPS Time Error",
    "Imu Stuck",        // 14: imuStuck
    "All Good",         // 15
    "Disarm Error",     // 16     
    "Arm Error",        // 17      
    "Prearm Error",     // 18     
    "Unexpected Error", // 19
    "Soft Geofence Violence", // 20          
    "Hard Geofence Violence", // 21 
    "Return Home Activated",  // 22       
    "Non Gps Landing Activated", // 23    
    "Flight Termination Activated"]; //24

// mission from ui
var mission_pub_1;
var mission_pub_2;
var mission_pub_3;
var mission_pub_4;
var mission_pub_5;
var mission_pub_6;
var mission_pub_7;
var mission_pub_8;
var mission_pub_9;
var mission_pub_10;

// ros instance
var ros_1;
var ros_2;
var ros_3;
var ros_4;
var ros_5;
var ros_6;
var ros_7;
var ros_8;
var ros_9;
var ros_10;

//trajectory of UAVs
var gps_path_1;
var gps_path_2;
var gps_path_3;
var gps_path_4;
var gps_path_5;
var gps_path_6;
var gps_path_7;
var gps_path_8;
var gps_path_9;
var gps_path_10;



function rosConnection(table_id,table_cell, uav_ip) {
    //vip: it is important to use reference here instead of value as a parameter
    window['ros_'+table_id] = new ROSLIB.Ros({
        url: "ws://" + uav_ip+ ":9090"
    });
    // alert("I'm in"+uav_ip);
    table_cell.innerHTML = "Waiting...";
    window['ros_'+table_id].on('connection', function() {
        table_cell.innerHTML = "Connected";
        table_cell.style.color = "limegreen";
    });

    window['ros_'+table_id].on('error', function(error) {
        table_cell.innerHTML = "ERROR: " + error;
        table_cell.style.color = "crimson";
    });

    window['ros_'+table_id].on('close', function() {
        table_cell.innerHTML = "Closed";
        table_cell.style.color = "crimson";
    });
}

function changeIp(ip, id) {
    var id_s2i = parseInt(id,10);
    // alert("I'm in"+id_s2i);
    rosConnection(window['ros_'+ id_s2i], document.getElementById("roslibjs_status_"+id_s2i), ip);
  }

function triggerSwarm(){
    if (document.getElementById('swarm_toggle').checked)
    {
        // alert("Checked")
        document.getElementById("mission").disabled = true;
    }
    else
        document.getElementById("mission").disabled = false;
}
function initVelocityPublisher() {
    // Init message with zero values.
    twist = new ROSLIB.Message({
        linear: {
            x: 0,
            y: 0,
            z: 0
        },
        angular: {
            x: 0,
            y: 0,
            z: 0
        }
    });
    // Init topic object
    cmdVel = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });
    // Register publisher within ROS system
    cmdVel.advertise();
}

function initMissionPublisher(uav_id, table_id) {
    // Init message with zero values.

    // Init topic object
    window['mission_pub_'+table_id] = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/mission_from_ui_'+uav_id,
        messageType : 'std_msgs/Byte'
    });
    // Register publisher within ROS system
    window['mission_pub_'+table_id].advertise();
}

function viewImage(uav_ip, table_id){
    var simulation = new ROSLIB.Param({
        ros : window['ros_'+ table_id],
        name : '/simulation'
    });

    simulation.get(function(value){
        console.log("Simulation: " + value);
        var zed_image =  document.getElementById('zed_image');
        if(value)
            zed_image.src = "http://" + uav_ip + ":8080/stream?topic=/zed/depth/depth_registered&type=mjpeg";
        else
            zed_image.src = "http://" + uav_ip + ":8080/stream?topic=/camera/image_raw&type=ros_compressed";
    });
}

function changeImg(id){
    var id_s2i = parseInt(id,10);
    // alert("I'm in "+id_s2i);
    img_IP =  document.getElementById(id_s2i+"_in").value;
    viewImage(img_IP);
}

function selectAllUAV( ){
    var checkboxes = document.getElementsByName('uav_checkbox');
    for(var i=0, n=checkboxes.length;i<n;i++) {
        checkboxes[i].checked =  true;
    }
}

function clearAllUAV( ){
    var checkboxes = document.getElementsByName('uav_checkbox');
    for(var i=0, n=checkboxes.length;i<n;i++) {
        checkboxes[i].checked = false;
    }
}

function taskManeger(){
    document.getElementById("engine0").onclick = function(){
        m_console.innerHTML = "Engine0 sent";
        var msg = new ROSLIB.Message({data : 0});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){ 
                window['mission_pub_'+table_id].publish(msg);
            }   
        }
    }

    document.getElementById("takeoff").onclick = function(){
        m_console.innerHTML = "Takeoff sent";
        var msg = new ROSLIB.Message({data : 1});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){
                window['mission_pub_'+table_id].publish(msg);
            }
        }
    }

    document.getElementById("mission").onclick = function(){
        m_console.innerHTML = "Mission sent";
        var msg = new ROSLIB.Message({data : 2});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){
                window['mission_pub_'+table_id].publish(msg);
            }
        }
    }

    document.getElementById("swarm").onclick = function(){
        m_console.innerHTML = "Swarm sent";
        var msg = new ROSLIB.Message({data : 3});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){
                window['mission_pub_'+table_id].publish(msg);
            }
        }
    }

    document.getElementById("hover").onclick = function(){
        m_console.innerHTML = "Hover sent";
        var msg = new ROSLIB.Message({data : 4});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){
                window['mission_pub_'+table_id].publish(msg);
            }
        }
    }

    document.getElementById("land").onclick = function(){
        m_console.innerHTML = "Land sent";
        var msg = new ROSLIB.Message({data : 5});
        for (var table_id=1; table_id<=uav_num; table_id++){
            if(document.getElementById(table_id + '_selected').checked){
                window['mission_pub_'+table_id].publish(msg);
            }
        }
    }
}

function CenterControl(controlDiv, map) {
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '0px solid #fff';
    controlUI.style.borderRadius = '3px';
    // controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px'; // to the bottom line of google map
    controlUI.style.textAlign = 'center';
    controlUI.style.justifyContent = 'center';
    controlUI.style.height = '4vh';
    controlUI.title = 'Click to choose test sites';
    controlDiv.appendChild(controlUI);
    
    //label_blackmore
    var label_blackmore = document.createElement('LABEL');
    label_blackmore.style.color = 'rgb(25,25,25)';
    label_blackmore.style.fontFamily = 'Roboto,Arial,sans-serif';
    label_blackmore.style.fontSize = '16px';
    label_blackmore.style.padding = '0.5vh 1vw 0.5vh 1vw'; //top right bottom left
    label_blackmore.innerHTML = "Blackmore";

    var toggle_blackmore = document.createElement('INPUT');
    toggle_blackmore.type = "radio";
    toggle_blackmore.id = "blackmore_btn";
    toggle_blackmore.name = "toggle_location";
    toggle_blackmore.checked = "checked";
    label_blackmore.appendChild(toggle_blackmore);
    controlUI.appendChild(label_blackmore); 

    // Setup the click event listeners: simply set the map to Blackmore.
    toggle_blackmore.addEventListener('click', function() {
        map.setCenter(Blackmore_Lat_Lon);
    });

    //label_tuas
    var label_tuas = document.createElement('LABEL');
    label_tuas.style.color = 'rgb(25,25,25)';
    label_tuas.style.fontFamily = 'Roboto,Arial,sans-serif';
    label_tuas.style.fontSize = '16px';
    label_tuas.style.padding = '0.5vh 1vw 0.5vh 1vw';
    label_tuas.innerHTML = "Tuas";

    var toggle_tuas = document.createElement('INPUT');
    toggle_tuas.type = "radio";
    toggle_tuas.id = "tuas_btn";
    toggle_tuas.name = "toggle_location";
    toggle_tuas.checked = "";
    label_tuas.appendChild(toggle_tuas);
    controlUI.appendChild(label_tuas); 
    
    toggle_tuas.addEventListener('click', function() {
        map.setCenter(Tuas_Lat_Lon);
    });

  }


function initMap() {

    google_map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: {lat: 1.32854998112, lng: 103.786003113}, //holland road
        // center: {lat: 1.299993, lng: 103.772041}, // test data tlab
        // center: {lat: 47.11967, lng: 8.6695}, // test data
        mapTypeId: 'satellite'
      });

    for (var table_id=1; table_id<=uav_num; table_id++){
        window["gps_path_"+table_id] = new google.maps.Polyline({
            strokeColor: pathColor[table_id-1],
            strokeOpacity: pathOpacity,
            strokeWeight: pathWeight
          });
        window["gps_path_"+table_id].setMap(google_map);
    }

    var router_points = [
        {lat: 1.267413, lng: 103.639773},
        {lat: 1.266713, lng: 103.638996},
        {lat: 1.266002, lng: 103.640052},
        {lat: 1.267094, lng: 103.640769},
        {lat: 1.267413, lng: 103.639773}
      ];

    var path_router = new google.maps.Polyline({
        path: router_points,
        strokeColor: "#D3D3D3",
        strokeOpacity: pathOpacity,
        strokeWeight: pathWeight
      });
    path_router.setMap(google_map);

    // constructor passing in this DIV.
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, google_map);

    centerControlDiv.index = 1;
    google_map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);

  }

window.onload = function () {
    // robot_IP = location.hostname;
    // Init handle for rosbridge_websocket

    $.getJSON( "kerriganlibjs/uav.json", function( uav_info ) {
        // console.log(uav_info.length);
        for (var table_id=1; table_id<=uav_num; table_id++){
            var uav_ip = uav_info[table_id-1].ip;
            var uav_id = uav_info[table_id-1].id;
            document.getElementById("id_"+table_id).innerHTML = uav_id;
            document.getElementById(table_id + "_in").value = uav_ip;
            console.log(uav_ip);
            console.log(uav_id);
            rosConnection(table_id,document.getElementById("roslibjs_status_"+table_id),uav_ip);
            // subscribeUAVPoseInfo(uav_id , table_id);
            subscribeUAVPoseWSpeed(uav_id , table_id);
            initMissionPublisher(uav_id, table_id);
            subscribeGPS(uav_id, table_id);
            // subscribeAltitude(uav_id, table_id);
            // subscribeBattery(uav_id, table_id);
            subscribeRosout(table_id);
            subErrorState(uav_id, table_id);
            if(document.getElementById(table_id+"_img").checked){
                img_IP = uav_ip;
                viewImage(img_IP,table_id);
            }
        }
      });
    m_console = document.getElementById("m_console");
    taskManeger();  // send command
}

    // Document.getElementById("wp_send").onclick = function(){
    //     // var points_pub = new ROSLIB.Topic({
    //     //     ros : ros,
    //     //     name : '/points_from_ui',
    //     //     messageType : 'geometry_msgs/Polygon'
    //     // });
    //     // // points_pub.advertise();
    //     // var msg = new ROSLIB.Message({data : 3});
    //     // points_pub.publish(msg);

    // }

// trigger a service
// var trigger_engine0 = new ROSLIB.ServiceRequest({});
// engine0_srv.callService(trigger_engine0,function(result){
//     if(result.success)
//         m_console.innerHTML = "Engine0 is activated!";
//     else
//         m_console.innerHTML = "Failed to activate engine0";
//     // var para = document.createElement("p");
//     // para.textContent = result.success.toString() + ', ' + result.message;
//     // var myConsoleRecord = document.getElementById("console-record");
//     // myConsoleRecord.insertBefore(para, myConsoleRecord.childNodes[0] );
// });
// initServices();
// function initServices(){
//     engine0_srv = new ROSLIB.Service({
//         ros : ros,
//         name : '/mavros/engine0',
//         serviceType : 'std_srv/Trigger'
//     });

//     // sethome_srv = new ROSLIB.Service({
//     //     ros : ros,
//     //     name : '/mavros/cmd/set_home',
//     //     serviceType : 'mavros/CommandHome'
//     // });
// }
