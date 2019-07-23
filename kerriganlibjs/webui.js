/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var m_console;
var points_pub;
var uav_num = 10;
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

function viewMap(){
    // Create the main viewer.
    var viewer = new ROS3D.Viewer({
        divID : 'rviz',
        width : 820,
        height : 350,
        // far: 300,
        cameraPose: {x: 0, y: 0, z: 15},
        cameraZoomSpeed: 2.0,
        antialias : true
        });
    viewer.addObject(new ROS3D.Grid({
        num_cells: 40,
        cellSize: 1,
        color: 0xa0a0a4
    }));
    // add one axes
    viewer.addObject(new ROS3D.Axes({
        ros: ros,
        tfClient: tfClient,
        shaftRadius: 0.1,
        headRadius: 0.3,
        headLength: 0.4,
        scale: 1.0,
        lineDashLength: 1.0
    }));
        // Setup a client to listen to TFs.
    var tfClient = new ROSLIB.TFClient({
        ros : ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : 'map'
        });
    var cloudClient = new ROS3D.PointCloud2({
        ros: ros,
        tfClient: tfClient,
        rootObject: viewer.scene,
        // max_pts: 307200,
        topic: '/points2',
        compression: '',
        material: { size: 0.3, color: 0x87CEEB }
    });
    var poseGlobalClient = new ROS3D.PoseWithCovariance({
        ros: ros,
        topic: '/ekf_fusion/pose',
        rootObject: viewer.scene,
        tfClient: tfClient,
        keep: 3,
        length: 1,
        headLength: 0.5,
        shaftDiameter: 0.3,
        headDiameter:0.6,
        color: 0xFFB6C1 //pink
      });

    var poseLocalClient = new ROS3D.PoseWithCovariance({
        ros: ros,
        topic: '/ekf_fusion/pose_local',
        rootObject: viewer.scene,
        tfClient: tfClient,
        keep: 3,
        length: 1,
        headLength: 0.5,
        shaftDiameter: 0.3,
        headDiameter:0.6,
        color: 0xFFD700 //yellow
      });
          // Add LaserScan data
    // var laserClient = new ROS3D.LaserScan({
    //     ros: ros,
    //     tfClient: tfClient,
    //     rootObject: viewer.scene,
    //     topic: '/scan',
    //     max_pts: 720,
    //     material : { color: 0xF4A460, size: 0.3}
    //   });

        // Add Path
    // var pathClient = new ROS3D.Path({
    //     ros: ros,
    //     tfClient: tfClient,
    //     rootObject: viewer.scene,
    //     topic: '/path',
    //     color: 0xff0000
    //   });
}

function viewImage(uav_ip){
    var zed_image =  document.getElementById('zed_image');
    zed_image.src = "http://" + uav_ip + ":8080/stream?topic=/zed/left/image_raw_color&type=ros_compressed";
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
        m_console.innerHTML = "Mission Start";
        var msg = new ROSLIB.Message({data : 2});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }

    document.getElementById("landing").onclick = function(){
        m_console.innerHTML = "Landing";
        var msg = new ROSLIB.Message({data : 3});
        for (var table_id=1; table_id<=uav_num; table_id++){
            window['mission_pub_'+table_id].publish(msg);
        }
    }
}
window.onload = function () {
    
    robot_IP = location.hostname;
    // Init handle for rosbridge_websocket
   
    for (var table_id=1; table_id<=uav_num; table_id++){
        var uav_ip =  document.getElementById(table_id+"_in").value;
        var uav_id = document.getElementById("id_"+table_id).textContent;

        rosConnection(table_id,document.getElementById("roslibjs_status_"+table_id),uav_ip);
        subscribeUAVPoseInfo(uav_id , table_id);
        initMissionPublisher(uav_id, table_id);
    }
    viewImage(robot_IP);
    // viewMap();
    // subscribeRosout();

    //Get elements
    m_console = document.getElementById("m_console");
    taskManeger();  // send command 
   
    

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
}


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