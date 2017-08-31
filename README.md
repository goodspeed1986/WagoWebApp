# WagoWebApp
Single Page Web Application for Wago Controllers

How To Run on PLC 750-880:
  1. Configure Target Settings in Codesys 2.3.9.xx. In Target Platform Tab check Download symbol.file and in Visualization Tab check Web Visualization.
  2. Configure Symbol File. In menu Project->Options->Symbol configuration->Configure symbol file choose variable that you want to see in App and check Export variables of object.
  If you want to write to this variable, you need to check Write access.
  3. Download test Codesys project.
  4. Put app folder to SD-Card on PLC.
  5. Write in browser http://PLC_IP/sd/app/index.html

How To Run on PFC200:
  1. Configure Target Settings in Codesys 2.3.9.xx. In Target Platform Tab check Download symbol.file and in Visualization Tab check Web Visualization.
  2. Configure Symbol File. In menu Project->Options->Symbol configuration->Configure symbol file choose variable that you want to see in App and check Export variables of object.
  If you want to write to this variable, you need to check Write access.
  3. Download test Codesys project.
  4. Put app folder to /var/www/.
  5. Write in browser http://PLC_IP/sd/app/index.html

How To Run on PC
  1. install nodejs.
  2. clone repository.
  3. npm install.
  4. npm run.
  5. Write in browser http://127.0.0.1:8080/app/index.html