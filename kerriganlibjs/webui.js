/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var m_console; // console of uav status
var points_pub;
var uav_num = 4; //number of drones
var google_map; //map instance
var pathOpacity = 1.0; // path opacity
var pathWeight = 2; //path width
var pathColor = ["#ffff00","#ff0000","#ff8000",  "#80ff00", "#00ff80",
"#00ffff", "#0000ff", "	#8000ff", "	#ff00bf", "	#ff0040"]; //path color
var markers = []; //Google map markers 
var img_IP;

// mission from ui
var mission_pub_1;
var mission_pub_2;
var mission_pub_3;
var mission_pub_4;


// ros instance
var ros_1;
var ros_2;
var ros_3;
var ros_4;


//trajectory of UAVs
var gps_path_1;
var gps_path_2;
var gps_path_3;
var gps_path_4;

var file_1;
var file_2;
var file_3;
var file_4;

var fileReader_1;
var fileReader_2;
var fileReader_3;
var fileReader_4;

var sendRefTimer;

var ref_1;
var ref_2;
var ref_3;
var ref_4;

var ref_num;


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

function initRefPublisher(uav_id, table_id) {
    // Init message with zero values.

    // Init topic object
    window['ref_'+table_id] = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/rt_ref_gen/old_current_state_'+ uav_id,
        messageType : 'common_msgs/state'
    });
    // Register publisher within ROS system
    window['ref_'+table_id].advertise();
}


function viewImage(uav_ip){
    var zed_image =  document.getElementById('zed_image');
    zed_image.src = "http://" + uav_ip + ":8080/stream?topic=/camera/image_raw&type=ros_compressed";
    // zed_image.src = "http://" + uav_ip + ":8080/stream?topic=/zed/depth/depth_registered&type=mjpeg";
}

function changeImg(id){
    var id_s2i = parseInt(id,10);
    // alert("I'm in "+id_s2i);
    img_IP =  document.getElementById(id_s2i+"_in").value;
    viewImage(img_IP);
}
function taskManeger(){
    document.getElementById("engine0").onclick = function(){
        m_console.innerHTML = "Clear previous UAV reference";
        var msg = new ROSLIB.Message({data : 0});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }

    document.getElementById("takeoff").onclick = function(){
        m_console.innerHTML = "Taking off";
        var msg = new ROSLIB.Message({data : 1});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }

    document.getElementById("mission").onclick = function(){
        // sendRefTimer = setInterval(sendRef, 20);
        m_console.innerHTML = "Mission Start";
        var msg = new ROSLIB.Message({data : 2});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }

    document.getElementById("landing").onclick = function(){
        clearInterval(sendRefTimer);

        m_console.innerHTML = "Landing";
        var msg = new ROSLIB.Message({data : 3});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }
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
        window['gps_path_'+table_id] = new google.maps.Polyline({
            strokeColor: pathColor[table_id-1],
            strokeOpacity: pathOpacity,
            strokeWeight: pathWeight
          });
        window['gps_path_'+table_id].setMap(google_map);
    }
  }

function sendRef(){
    var stopSending = 0;
    for (var table_id=1; table_id<=uav_num; table_id++){
      
        if(ref_num<window['file_'+ table_id].length)
        {
            stopSending = stopSending + 1;
            var refLine = window['file_'+ table_id][ref_num].split(" ");
            console.log(refLine);
            if(refLine.length == 9)
            {
                var refMsg = new ROSLIB.Message({
                    pos: {
                        x: parseFloat(refLine[0]),
                        y: parseFloat(refLine[1]),
                        z: parseFloat(refLine[2])
                    },
                    vel: {
                        x: parseFloat(refLine[3]),
                        y: parseFloat(refLine[4]),
                        z: parseFloat(refLine[5])
                    },
            
                    acc: {
                        x: parseFloat(refLine[6]),
                        y: parseFloat(refLine[7]),
                        z: parseFloat(refLine[8])
                    }
                });
                window['ref_'+table_id].publish(refMsg);
            }
        }
    }

    if(stopSending)
    {
        ref_num = ref_num + 1;

    }
    // console.log(ref_num);
}

window.onload = function () {  
    // robot_IP = location.hostname;
    // Init handle for rosbridge_websocket
    ref_num = 0;
   
    for (var table_id=1; table_id<=uav_num; table_id++){
        var uav_ip =  document.getElementById(table_id+"_in").value;
        var uav_id = document.getElementById("id_"+table_id).textContent;
        // console.log(uav_ip);
          
        rosConnection(table_id,document.getElementById("roslibjs_status_"+table_id),uav_ip);
        subscribeUAVPoseInfo(uav_id , table_id);
        initMissionPublisher(uav_id, table_id);  
        // subscribeGPS(uav_id, table_id);
        // subscribeAltitude(uav_id, table_id);
        subscribeBattery(uav_id, table_id);
        subscribeRosout(table_id);
        initRefPublisher(uav_id, table_id);
        // if(document.getElementById(table_id+"_img").checked)
        //     img_IP = uav_ip;
    }
    // viewImage(img_IP);
    m_console = document.getElementById("m_console");
    taskManeger();  // send command 

    document.getElementById('upload_file').onchange = function(){
        var filelist = this.files;

        function setupReader(file) {
            var file_id = parseInt(file.name);
            window['fileReader_'+ file_id]  = new FileReader();
            window['fileReader_'+ file_id].onload = function(progressEvent){
                console.log(file_id);
            // var contents = progressEvent.target.result;
            // console.log("File contents: " + contents);
            window['file_'+ file_id] = this.result.split('\n').slice(0);//Array.from(
            // for(var line = 0; line < lines.length; line++){
            // var res = lines[line].split(" ");
            console.log(window['file_'+ file_id]);
            // console.log(i);
            // }
            }
            window['fileReader_'+ file_id].readAsText(file);

        }
        for (var i = 0; i < filelist.length; i++) {
            setupReader(filelist[i]);
        }
        
      };

     
     

     
      

   

} 

// }

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