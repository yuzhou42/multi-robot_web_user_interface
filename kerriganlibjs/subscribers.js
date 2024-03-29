/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var yaw_global;
var yaw_local;
var z_global;

function subscribeRosout(table_id){
        //// Subscribe to /rosout
        var listener = new ROSLIB.Topic({
            ros : window['ros_'+ table_id],
            name : '/rosout_agg',
            messageType : 'rosgraph_msgs/Log'
        });

        // subscriber callback
        listener.subscribe(function(msg){
            var CLASS_NAME;
            //http://docs.ros.org/hydro/api/rosgraph_msgs/html/msg/Log.html
            switch(msg.name){
                case '/ddrone_task_manager':
                    switch(msg.level){
                        case 1: //debug
                            // alert("kidding");
                            CLASS_NAME = "text-primary";
                            break;
                        case 2: // info
                            CLASS_NAME = "text-primary";
                            break;
                        case 4: // warning
                            CLASS_NAME = "text-warning";
                            var uav_status = document.getElementById("uav_status_"+table_id);
                            uav_status.className = CLASS_NAME;
                            uav_status.innerHTML = msg.msg;
                            break;
                        case 8: //error
                        case 16: // fatal
                            CLASS_NAME = "text-danger";
                            break;
                    }

                    var taskManagerConsole = document.getElementById("console_span_"+table_id);
                    taskManagerConsole.className = CLASS_NAME;
                    taskManagerConsole.innerHTML = msg.msg;
                    break;
                default :
                    // console.log(msg.name + ": " + msg.msg);
                    break;
            }

            // var myConsole = document.getElementById("uav_cosole");
            // var para = document.createElement("p");
            // para.textContent = 'seq ' + msg.header.seq + ' > ' +   msg.name + ": " + msg.msg;
            // para.style.cssText = 'margin-bottom: 0px;';
            // para.className = CLASS_NAME;
            // myConsole.insertBefore(para, myConsole.childNodes[0]);
        });
}

function subscribeUAVPoseInfo(uav_id, table_id){

    var listener = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/mavros/position/local_nwu/sys_id_' + uav_id,
        messageType : 'geometry_msgs/PoseStamped'
    });
    // alert(listener.name);
    listener.subscribe(function(msg){
        // alert(uav_id);
        // document.getElementById("x_"+table_id).innerHTML = msg.pose.position.x.toFixed(2);
        // document.getElementById("y_"+table_id).innerHTML = msg.pose.position.y.toFixed(2);
        document.getElementById("z_"+table_id).innerHTML = msg.pose.position.z.toFixed(2);
        // z_global = msg.pose.position.z.toFixed(2);
        var q = msg.pose.orientation;
        var yaw = - Math.atan2(2.0*(q.x*q.y + q.w*q.z), (q.w*q.w + q.x*q.x - q.y*q.y - q.z*q.z))/Math.PI*180;
        document.getElementById("heading_"+table_id).innerHTML = yaw.toFixed(0);
        
    });

}

function subscribeUAVPoseWSpeed(uav_id, table_id){

    var listener = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/mavros/position/local_state/sys_id_' + uav_id,
        messageType : 'nus_msgs/StateWithCovarianceStamped'
    });
    // alert(listener.name);
    listener.subscribe(function(msg){
        // alert(uav_id);
        var vx = msg.velocity.twist.linear.x;
        var vy = msg.velocity.twist.linear.y;
        var vz = msg.velocity.twist.linear.z;
        var uav_speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
        document.getElementById("z_"+table_id).innerHTML = msg.pose.pose.position.z.toFixed(2);
        document.getElementById("speed_"+table_id).innerHTML = uav_speed.toFixed(2);
    });
}

function subErrorState(uav_id, table_id){
    var listener = new ROSLIB.Topic(
        {
            ros: window['ros_' + table_id],
            name: '/task_manager/error_state/sys_id_' + uav_id,
            messageType: 'std_msgs/Byte'
        }
    );
        
    listener.subscribe(function(msg){
        var CLASS_NAME;
        switch(msg.data){
            case 15:
                CLASS_NAME = "text-success";
                break;
            case 22:
            case 23:
            case 24:
                CLASS_NAME = "text-warning";
                break;
            default:
                CLASS_NAME = "text-danger";
                break;
        }

        var error_table = document.getElementById("error_"+table_id);
        error_table.className = CLASS_NAME;
        error_table.innerHTML = errorState[msg.data];
        // console.log(errorState[msg.data]);
    });
}

function subscribeGPS(uav_id, table_id){

    var listener = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/mavros/global_position/global/sys_id_'  + uav_id,
        // name : '/px4/raw/gps' ,
        messageType : 'sensor_msgs/NavSatFix'
    });
    listener.subscribe(function(msg){

        document.getElementById("x_"+table_id).innerHTML = msg.latitude.toFixed(5);
        document.getElementById("y_"+table_id).innerHTML = msg.longitude.toFixed(5);
        document.getElementById("altitude_"+table_id).innerHTML = msg.altitude.toFixed(2);

        // alert(msg.latitude);
        var path =  window["gps_path_"+table_id].getPath();
        var polyLatLng = new google.maps.LatLng(msg.latitude, msg.longitude);
        path.push(polyLatLng);

        if(markers[table_id-1])
            markers[table_id-1].setMap(null); // clear marker before adding
        var marker = new google.maps.Marker({
            position: {lat: msg.latitude, lng:  msg.longitude},
            map: google_map,
            label: uav_id
        });
        markers[table_id-1] = marker;
        markers[table_id-1].setMap(google_map);


        // alert(path.getLength());
    });
}

// function subscribeBattery(uav_id, table_id){

//     var listener = new ROSLIB.Topic({
//         ros : window['ros_'+ table_id],
//         name : '/mavros/battery/sys_id_'  + uav_id,
//         // name : '/px4/raw/gps' ,
//         messageType : 'mavros/BatteryStatus'
//     });
//     listener.subscribe(function(msg){
//         // alert(uav_id);
//         document.getElementById("battery_"+table_id).innerHTML = msg.voltage.toFixed(2);
//     });
// }

// function subscribeAltitude(uav_id, table_id){

//     var listener = new ROSLIB.Topic({
//         ros : window['ros_'+ table_id],
//         name : '/mavros/global_position/global/sys_id_'  + uav_id,
//         // name : '/px4/raw/gps' ,
//         messageType : 'sensor_msgs/NavSatFix'
//     });
//     listener.subscribe(function(msg){
//         // alert(table_id);
//         document.getElementById("x_"+table_id).innerHTML = msg.latitude.toFixed(6);
//         document.getElementById("y_"+table_id).innerHTML = msg.longitude.toFixed(6);
//         document.getElementById("altitude_"+table_id).innerHTML = msg.altitude.toFixed(2);
//     });
// }

