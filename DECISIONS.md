# DECISIONS
## IDEMPOTENCE DE LA CREATION DES CONVERSIONS
Il faut garantir l'idempotence du process de création de la conversion. Pour cela, je me base sur la clé d'idempotence généré côté client:
* le client génère la clé et l'envoie dans l'en-tête dédié
* l'api intercepte la requête, vérifie en BDD si la clé a déjà été traitée
    * si la clé existe, l'api renvoit la conversion existante
    * si la clé est nouvelle, l'api traite la requête et renvoit la réponse

Concrètement, dans ce cas, la méthode qui orchestre la création d'une conversion à partir d'une cotation:
* récupère la cotation par son ID
* vérifie que cette cotation existe, qu'elle n'est pas expirée, ni déjà consommée
* cherche si une conversion existe déjà pour la même clé d'idempotence
* si une conversion existe, elle est retournée au client
* si aucune conversion n'existe, elle est créé et retournée au client 

Sur ce primo-traitement, j'ai très vite rencontré un problème de concurrence (une race condition de type TOCTOU): si plusieurs requêtes arrivent au même moment, elles peuvent essayer d'écrire en base. J'ai donc essayé une version qui consiste à traiter la création de la conversion comme une opération atomique de bout en bout:
* une transaction qui réserve la cotation avec un verrou, vérifie si une conversion avec la clé d'idempotence existe, crée une conversion si nécessaire et marque la cotation comme consommée

Pour garantir l'idempotence de cette opération, je me base sur la clé d'idempotence (la vrai clé d'unicité), je verrouille la cotation lors de la création de la conversion dans une opération atomique, je sépare la création auprès du provider distant de la création locale.

## DECOUPLAGE WEBHOOK ET METIER
Effectivement, j'ai très vite constaté que certains évènements du webhook étaient reçus avant la création locale de la conversion. Lors de ma primo-implémentation, j'avais couplé le traitement des évènements avec la création de la conversion.

J'ai pensé que toutes les opérations liés au traitement des évènements devaient être découplés des traitements locaux. Pour cela, j'ai: 
* déployé une nouvelle table pour persister les évènements webhooks
* mis en place un repository et un service qui permettent d'enregistrer l'évènement émis par le webhook dès qu'il arrive
* développé un worker indépendant qui traite les évènements en attente et mets à jour les conversions suivant 

## CALCUL DU SOLDE
Si un auditeur souhaite connaître les soldes à une date donnée, il faudrait récupérer son solde initial, et toutes les conversions faites à la date voulue. On peut "rejouer" toutes les conversions ayant aboutis en partant du solde initial.
J'ai mis en place une méthode qui, à partir d'un solde et d'une conversion, calcule un nouveau solde. Cette méthode pourra être utilisé à cette fin.

## RESTE À FAIRE
* S'assurer de l'ordre dans lequel sont traités les évènements webhooks (s'assurer de traiter `accepted` avant `completed`)
* Vérifier que la nouvelle conversion est possible en calculant le nouveau solde (s'assurer par exemple qu'on aura pas un solde négatif pour une devise)
* Développer une table pour les soldes par client (actualisé lors du traitement d'une conversion)
* Nettoyer en BDD les cotations non consommés