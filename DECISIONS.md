# DECISIONS
## IDEMPOTENCE DE LA CREATION DES CONVERSIONS
_Question: Comment garantis-tu qu'une conversion n'est jamais exécutée deux fois?_

Il faut garantir l'idempotence du process de création de la conversion. Pour cela, je me base sur la clé d'idempotence généré côté client:
* le client génère la clé et l'envoie dans la requête de création de l'ordre de conversion, dans l'en-tête dédié
* l'api intercepte la requête, vérifie en BDD si la clé a déjà été traitée
    * si la clé existe, l'api renvoit la conversion existante
    * si la clé est nouvelle, l'api traite la requête et renvoit la réponse

Concrètement, dans le cas d'espèce, la méthode qui orchestre la création d'une conversion à partir d'une cotation:
* récupère la cotation par son identifiant
* vérifie que cette cotation existe, qu'elle n'est pas expirée, ni déjà consommée
* cherche si une conversion existe déjà pour la même clé d'idempotence
* si une conversion existe, elle est retournée au client
* si aucune conversion n'existe, elle est créé et retournée au client 

J'ai très vite rencontré un problème de concurrence (une race condition de type TOCTOU): si plusieurs requêtes arrivent au même moment, elles peuvent essayer d'écrire en base au même moment. J'ai donc essayé une version qui consiste à traiter la création de la conversion comme une opération atomique de bout en bout: une transaction qui réserve la cotation avec un verrou, vérifie si une conversion avec la clé d'idempotence existe, crée une conversion si nécessaire et marque la cotation comme consommée. Ainsi, si plusieurs requêtes arrivent au même moment, la première est traitée mais les suivantes reçoivent une erreur de type 400 car la cotation a déjà été consommée.

Pour garantir l'idempotence de cette opération, je me base donc sur la clé d'idempotence (la vrai clé d'unicité), je verrouille la cotation lors de la création de la conversion dans une opération atomique, je sépare la création auprès du provider distant de la création locale.

## DECOUPLAGE WEBHOOK ET METIER
_Question: Que se passe-t-il si le webhook arrive avant la fin de l'appel d'exécution ? Et s'il arrive deux fois?_
Lors de ma primo-implémentation, j'avais couplé le traitement des évènements avec le traitement de l'ordre de création de la conversion et effectivement, j'ai très vite constaté que certains évènements du webhook étaient reçus avant la création locale de la conversion.
J'ai pensé que toutes les opérations liés à la réception des évènements devaient être découplés des autres traitements locaux métier. Pour cela, j'ai: 
* déployé une nouvelle table (la table `events`) pour persister les évènements webhooks
* mis en place un repository et un service qui permettent d'enregistrer l'évènement émis par le webhook dès qu'il arrive
* développé un worker indépendant (`WebhooksWorker`) qui traite les évènements en attente et mets à jour les conversions suivant le statut porté l'évènement.

Ainsi, donc mon api peut recevoir l'évènement webhook, le persister, puis, le traiter ultérieurement. Si le même évènement arrive plusieurs fois, uniquement le premier est persisté car j'ai une contrainte d'unicité sur l'identifiant de l'évènement.

## CALCUL DU SOLDE
_Question: Comment un auditeur pourrait-il vérifier, six mois plus tard, le solde d'un client à une date donnée?_
Pour calculer le solde d'un utilisateur à une date donnée, il faut pouvoir "rejouer" l'historique des ordres de conversion. À partir de son solde courant et des opérations de conversion faites depuis la date donnée, on peut appliquer à rebours chaque opération au solde initial et obtenir un solde pour la date voulue.
J'ai mis en place une méthode qui, à partir d'un solde et d'une conversion, calcule un nouveau solde. Cette méthode pourra être utilisé à cette fin.

## RESTE À FAIRE
_Question: Qu'as-tu volontairement laissé de côté, et que ferais-tu en priorité avec une semaine de plus?_
* Ajouter un process de réconciliation: il existe possiblement des ordres de conversion dont on n'a reçu aucun évènement webhook d'acceptation ou de mise à jour côté partenaire. Ces ordres restent donc en statut `SUBMITTED` ou `PENDING`. Il faudrait un process qui interroge leur statut chez le partenaire, compare avec leur statut actuel afin de les mettre à jour.
* S'assurer de l'ordre dans lequel sont traités les évènements webhooks: si les évènements arrivent de manière désordonné, il faudrait assurer une cohérence dans leur traitement (ex.: s'assurer de traiter l'évènement `accepted` avant l'évènement `completed`)
* Vérifier que la nouvelle conversion est possible en calculant le nouveau solde (s'assurer par exemple qu'on aura pas un solde négatif pour une devise)
* Développer une table pour les soldes par client (actualisé lors du traitement d'une conversion)
* Ajouter un process de nettoyage en BDD des cotations non consommés et des évènements traités depuis un certain temps
* Ajouter une pagination sur la route de récupération des conversions
* S'assurer que la devise source est bien différente de la devise cible
* Ajouter un process de graceful shutdown qui permettra d'arrêter proprement les workers, les connexions et le webserver
* Ajouter plus de tests unitaires sur les services et les routes

## AUTRES ELEMENTS DE CONTEXTE
Les entités métier qui sont manipulés par les services et les workers: 
* `Money` qui associe un montant et une devise; il permet les opérations et les comparaisons financières, 
* `Quote` qui représente une cotation et persisté dans la table `quotes`, 
* `Conversion` qui représente une opération de conversion, est identifié par la clé d'idempotence et persisté dans la table `conversions`, 
* `Balance` qui représente le solde d'un utilisateur, identifié par l'identifiant de ce dernier
* `Event` pour les évènements webhooks, persisté dans la table `events`
* `User` qui est une entité anémique pour désigner les clients

Les workers indépendants:
* `WebhooksWorker`: Il traite les évènements webhooks reçus et mets à jour les ordres de conversion.
* `ConversionsWorker`: Il soumet au partenaire bancaire les ordres de conversion reçus et les mets à jour.

Les hypothèses:
* Solde initial unique par client: j'ai un client unique avec un solde initial à 1000 euros, 1000 dollars et 1000 pounds.
* Frais de conversion initialisé: j'ai fixé les frais de conversion à une unité de la devise source.