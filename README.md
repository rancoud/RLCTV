# RLCTV
Chat Bot Competition - RLCTV - https://www.livecoding.tv/rancoud

## How to configure Standalone
1. Rename file conf.login.sample.js in conf.login.sample.js  
2. Fill informations
3. Change in main.js the rooms you want to join by adding or deleting object in clients array
4. npm install
5. node main.js (localhost:8080 for song-request)

## TODO
- [x] se connecter au chat
- [x] lire les messages
- [x] lire les personnes entrante et sortante
- [x] repérer des commandes
- [x] multiroom
- [x] detecter la fréquence des utilisateurs
- [x] saluer les nouveaux
- [x] reconnaitre les réguliers
- [x] tools : liste des outils utilisé
- [x] song playing
- [x] song request
- [ ] interface web pour gestion

## Interface web
node app.js
localhost:4040
/ -> accueil explication du service
/login -> save conf for log
/register -> register
/logout -> disconnect
/dashboard -> join/leave bot
/users -> lists users (avec fréquence)
/users/settings -> parametrages des utilisateurs
/infos/settings -> parametrage des infos
/commands -> list des commandes
/commands/edit -> edition des commandes
/songs -> list des chansons avec la vidéo du song request
/songs/settings -> parametrages / bans
/modules -> listes des modules