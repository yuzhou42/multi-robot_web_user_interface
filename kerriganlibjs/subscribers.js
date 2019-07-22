/*
 * Created on Thu July 18 2019
 * Copyright  2019 - Yu Zhou
 * Email: yu.nico.zhou@gmail.com
 */
var yaw_global;
var yaw_local;
var z_global;

function subscribeRosout(){
        //// Subscribe to /rosout
        var listener = new ROSLIB.Topic({
            ros : ros,
            name : '/rosout_agg',
            messageType : 'rosgraph_msgs/Log'
        });
        
        // subscriber callback
        listener.subscribe(function(msg){
            switch(msg.name){
                case '/ddrone_task_manager':
                    var taskManagerConsole = document.getElementById("m_console");
                    taskManagerConsole.innerHTML = msg.msg;
                    break;
                default : 
                    // console.log(msg.name + ": " + msg.msg);
                    break;
            }
            var CLASS_NAME;
            switch(msg.level){
                case 2: // info
                    CLASS_NAME = "text-primary";
                    break;
                case 4: // warning
                    CLASS_NAME = "text-warning";
                    break;
                case 8: //error
                case 16: // fatal
                    CLASS_NAME = "text-danger";
                    break;
            }
            var myConsole = document.getElementById("uav_cosole");
            var para = document.createElement("p");
            para.textContent = 'seq ' + msg.header.seq + ' > ' +   msg.name + ": " + msg.msg;
            para.style.cssText = 'margin-bottom: 0px;';
            para.className = CLASS_NAME;
            // myConsole.innerHTML = para.textContent;
            // myConsole.appendChild(para);
            myConsole.insertBefore(para, myConsole.childNodes[0]);
            // console.log(msg);
        });
}



// function subscribeZEDPoseInfo(){
//     var listener = new ROSLIB.Topic({
//         ros : ros,
//         name : '/zed/pose',
//         messageType : 'geometry_msgs/PoseStamped'
//     });

//     listener.subscribe(function(msg){
//         document.getElementById("x_zed").innerHTML = msg.pose.position.x.toFixed(2);
//         document.getElementById("y_zed").innerHTML = msg.pose.position.y.toFixed(2);
//         document.getElementById("z_zed").innerHTML = msg.pose.position.z.toFixed(2);
        
//         var q = msg.pose.orientation;
//         var yaw = - Math.atan2(2.0*(q.x*q.y + q.w*q.z), (q.w*q.w + q.x*q.x - q.y*q.y - q.z*q.z))/Math.PI*180;
//         // var yaw = Math.asin(-2.0*(q.x*q.z - q.w*q.y))/Math.PI*180;
//         // var yaw = Math.atan2(2.0*(q.y*q.z + q.w*q.x), q.w*q.w - q.x*q.x - q.y*q.y + q.z*q.z)/Math.PI*180;
//         document.getElementById("yaw_zed").innerHTML = yaw.toFixed(0);
//         var yaw_local = yaw.toFixed(0);
//         // atan2(2.0*(q.y*q.z + q.w*q.x), q.w*q.w - q.x*q.x - q.y*q.y + q.z*q.z);
//     });
// }

function subscribeUAVPoseInfo(uav_id, table_id){
    
    var listener = new ROSLIB.Topic({
        ros : window['ros_'+ table_id],
        name : '/mavros/position/local_nwu/sys_id_' + uav_id,
        messageType : 'geometry_msgs/PoseStamped'
    });
    // alert(listener.name);
    listener.subscribe(function(msg){
        // alert(uav_id);
        document.getElementById("x_"+table_id).innerHTML = msg.pose.position.x.toFixed(2);
        document.getElementById("y_"+table_id).innerHTML = msg.pose.position.y.toFixed(2);
        document.getElementById("z_"+table_id).innerHTML = msg.pose.position.z.toFixed(2);
        // z_global = msg.pose.position.z.toFixed(2);
        var q = msg.pose.orientation;
        var yaw = - Math.atan2(2.0*(q.x*q.y + q.w*q.z), (q.w*q.w + q.x*q.x - q.y*q.y - q.z*q.z))/Math.PI*180;
        // var yaw = Math.asin(-2.0*(q.x*q.z - q.w*q.y))/Math.PI*180;
        // var yaw = Math.atan2(2.0*(q.y*q.z + q.w*q.x), q.w*q.w - q.x*q.x - q.y*q.y + q.z*q.z)/Math.PI*180;
        document.getElementById("heading_"+table_id).innerHTML = yaw.toFixed(0);
        // atan2(2.0*(q.y*q.z + q.w*q.x), q.w*q.w - q.x*q.x - q.y*q.y + q.z*q.z);
        
    });
}


