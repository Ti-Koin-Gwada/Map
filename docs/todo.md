[X] ajouté la possibilité de rajouté la carte des resto coté admin et la possiblité d'ouvrir la carte en question coté client
[X] que les clients puissent filtrer par type de spot
[X] pouvoir également lors de la création de carte personalisé pouvoir faire des tracé entre les points pour par exemple faire un truc le matin aller dans ce resto et ensuite a cette plage. Il faut pouvoir créer un tracé et rentré les spots dans un certain ordre
[X] l'ui pour les cartes clients sur mobile dans le bas il faut retirer le nombre de spot et aussi ajouté le filtre des type de spots
[X] retirer les tags pour les spots
[X] par rapport a la feature d'ajout d'itinéraire quon a ajouté, c'est pas exactement comme ca qu'il fallait le faire. Je vuex que sur une meme carte il puisse y avoir des itinéraires et des spots classiques. Le bouton est bien placé mais il faudrai que ca marche comme ca : quand on appuies sur le bouton l'interface change un peu pour nous faire comprendre que l'on créer une itinéraire et ensuite on selectionne les spots dans l'ordre (on peut toujours changé l'ordre avec les fleche apres) et lorsqu'on rappuie sur le bouton cela nous demande de validé l'itinéraire et ensuite seulement on a créer une itinéraire sur notre carte et on peut continué a ajouté des spots normalement
[X] avoir la posibilité pour le client d'ajouté son domicile sur sa carte personelle avec un pin différent symbolisant le domicile
[X] le bouton Y Aller ne prend pas l'adresse mais le titre du spot. Il faut que le bouton y allé prenne comme reference l'adresse




Ce qu'on vient de mettre en place
  
  Avant l'implémentation d'aujourd'hui, la session fonctionnait comme ça :

  Login → JWT 7 jours stocké dans localStorage

  Le problème : si quelqu'un arrive à exécuter du JavaScript sur la page (XSS), il vole le token et a accès à l'admin pendant 7 jours
  complets.

  Maintenant :

  Login → access token 15min en mémoire RAM
                + refresh token 7 jours dans un cookie HttpOnly

  Access token en mémoire = JavaScript ne peut pas le lire. Il disparaît à la fermeture de l'onglet.
  Cookie HttpOnly = JavaScript ne peut jamais y accéder, même avec un XSS. Seul le navigateur l'envoie automatiquement aux bonnes
  routes.
  15 minutes = si quelqu'un intercepte un access token sur le réseau, il expire vite.
  Auto-rotation = 60 secondes avant expiry, le hook demande silencieusement un nouveau token. Flo ne voit jamais l'écran de connexion
  sauf si sa session a vraiment expiré.