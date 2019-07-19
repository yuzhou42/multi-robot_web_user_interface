/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var twist;
var cmdVel;
var robot_IP;
var mission_pub;
var m_console;
var points_pub;
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

function rosConnection(ros_instance, table_cell, uav_ip) {
    ros_instance = new ROSLIB.Ros({
        url: "ws://" + uav_ip+ ":9090"
    });
    // alert("I'm in"+uav_ip);
    table_cell.innerHTML = "Waiting...";
    ros_instance.on('connection', function() {
        table_cell.innerHTML = "Connected";
        table_cell.style.color = "limegreen";
    });

    ros_instance.on('error', function(error) {
        table_cell.innerHTML = "ERROR: " + error;
        table_cell.style.color = "crimson";
    });

    ros_instance.on('close', function() {
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

function initMissionPublisher() {
    // Init message with zero values.

    // Init topic object
    mission_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/mission_from_ui',
        messageType : 'std_msgs/Byte'
    });
    // Register publisher within ROS system
    mission_pub.advertise();

    Skip_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/mission_skip_point',
        messageType : 'std_msgs/Bool'
    });
    // Register publisher within ROS system
    Skip_pub.advertise();
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

function viewImage(){
    zed_image =  document.getElementById('zed_image');
    zed_image.src = "http://" + robot_IP + ":8080/stream?topic=/zed/left/image_raw_color&type=ros_compressed";
    
    // confidence_map = document.getElementById('confi_image');
    // confidence_map.src = "http://" + robot_IP + ":8080/stream?topic=/zed/confidence/confidence_image&type=ros_compressed";
}
window.onload = function () {
    
    // robot_IP = location.hostname;
    // Init handle for rosbridge_websocket
    for (var i=1; i<=2; i++){
        rosConnection(window['ros_'+i], document.getElementById("roslibjs_status_"+i), document.getElementById(i+"_in").value);
    }

    subscribeUAVPoseInfo();
    subscribeRosout();
    subscribeUAV150PoseInfo();
    subscribeGlobalPoseInfo();
    viewMap();
    viewImage();
    initMissionPublisher();

    m_console = document.getElementById("m_console");

    document.getElementById("engine0").onclick = function(){
        m_console.innerHTML = "Clear previous UAV status!";
        var msg = new ROSLIB.Message({data : 0});
        mission_pub.publish(msg);
    }

    document.getElementById("takeoff").onclick = function(){
        m_console.innerHTML = "Taking off!";
        var msg = new ROSLIB.Message({data : 1});
        mission_pub.publish(msg);
    }

    document.getElementById("mission").onclick = function(){
        // m_console.innerHTML = "Start mission";
        var msg = new ROSLIB.Message({data : 2});
        mission_pub.publish(msg);
    }

    document.getElementById("landing").onclick = function(){
        m_console.innerHTML = "Landing";
        var msg = new ROSLIB.Message({data : 3});
        mission_pub.publish(msg);
    }
    document.getElementById("wp_skip").onclick = function(){
        m_console.innerHTML = "Skip the current point!";
        var msg = new ROSLIB.Message({data : true});
        Skip_pub.publish(msg);
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