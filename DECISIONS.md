# DECISIONS
## IDEMPOTENCE DE LA CREATION DES CONVERSIONS
_Question: Comment garantis-tu qu'une conversion n'est jamais exécutée deux fois?_

L'ordre de conversion est soumise à une machine à états strict. Une fois l'ordre de conversion créé, il a un statut `CREATED`. Il s'agit d'un état initial, unique dans le cycle de vie de l'ordre de conversion. Un worker `ConversionWorker` est dédié à la soumission de l'ordre de conversion au système bancaire.
* Fonctionnement du worker
    * récupération des ordres de conversion créés, au statut `CREATED`, avec un passage au statut `SUBMITTING`
    * soumission des ordres récupérés au partenaire bancaire (uniquement les ordres au statut `SUBMITTING`)
    * mise à jour des statuts des ordres de conversion selon la table de transitions suivante

| Etat source | Evènement | Etat cible |
|:-----:|:----:|:-----:|
| CREATED | prise en charge worker soumission à la banque | SUBMITTING |
| SUBMITTING | rejet immédiat de la soumission | REJECTED |
| SUBMITTING | crash du worker | SUBMITTING |
| SUBMITTING | succès de la soumission | SUBMITTED |
| SUBMITTING | T/O ou erreur indéterminé | UNKNOWN |

Ainsi donc, l'ordre de conversion passe par les statuts suivants: `CREATED` -> `SUBMITTING` -> `SUBMITTING`/`SUBMITTED`/`REJECTED`/`UNKNOWN`.

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