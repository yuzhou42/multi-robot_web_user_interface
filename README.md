# Kerrigan UI package
# Set up
## Dependencies
### rospackages
1. web_video_server
    ```
    $ sudo apt-get install ros-kinetic-web-video-server
        It launches the server for streaming ROS image messages as video through the web.
    ```
2. rosbridge_server
    ```
    $ sudo apt-get install ros-kinetic-rosbridge-suite
    It launches the web sockets to allow web apps to publish or subscribe ROS messages.
    ``` 
3. tf2-web-republisher
   ```
   $ sudo apt-get install ros-kinetic-tf2-web-republisher
   ```

### vscode install
1. Bootstrap 4, Font awesome 4, Font Awesome 5 Free & Pro snippets.

This is the framework itself with couple of additional features which contain ready-to-use templates and other stuff useful while developing in bootstrap.
2. Live Server 

    To see your web UI changes in realtime
3. Prettier Code formatter 

    To keep your source code clean
4.  vscode-icons 

    To make your workspace look good

### libraries 
   Download them and then add to your local repo. It could be tricky as the js script has many versions and may not work very well on your projects. Need to try them out and choose the working one. 

## Deploy
### Install
- nginx
```
$ sudo apt-get update
$ sudo apt-get install nginx
```
- MySQL
```
$ sudo apt-get install mysql-server
```
- PHP
```
$ sudo apt-get install php php-mcrypt php-mysql
```
- nodejs
```
$ sudo apt-get install nodejs
```
### Setup
1. Make sure the www-data user can access the FULL path of the website folder!!! 
```
$ chmod 755 folder_name
```
2. Config nginx
```
$ sudo gedit /etc/nginx/sites-enabled/default
find line:
$ root /var/www/html;
and change value /var/www/html to the path to your app.
root /media/nvidia/SD/catkin_ws/src/ddrone_v2/ddrone_ui/index.html;
```
3. Restart Nginx:
```
$ sudo systemctl restart nginx
```

# Usage
```
$ roslaunch ddrone_task_manager ddrone_ui.launch
And then launch other ros package that you need.

```

# Tutorials and useful websites
1. [Bootstrap 4 + ROS](https://medium.com/husarion-blog/bootstrap-4-ros-creating-a-web-ui-for-your-robot-9a77a8e373f9)
2. [Bootstrap 4 Tutorial](https://www.w3schools.com/bootstrap4/default.asp)
3. [ROBOTWEBTOOLS](http://robotwebtools.org/tools.html)
4. [Theme](https://bootswatch.com/)
5. [HTML color code](https://www.rapidtables.com/web/color/html-color-codes.htmls)
 

# MISC
- ROS should have dataflow to enable the connection
- 

# Log
## Finished
- multiple ros connection
- reconnect by manully inputing an ip address
- table showing uav status
- 

# To do
-  

