## GENERAL KNOWLEDGE

* Ledger: registre décentralisé et distribué qui enregistre et comptabilise toutes les transactions financières de l'organisation, garantissant transparence et sécurité

* Réconciliation: opération qui consiste à automatiser la comparaison et la mise en correspondance des enregistrements financiers pour garantir leur cohérence et leur exactitude, réduisant ainsi les erreurs et optimisant le contrôle interne

* Process KYC/KYB (Know your customer/Know your business): procédures de vérification d'identité essentielles pour garantir la conformité réglementaire et la sécurité des transactions. Le KYC permet de sécuriser les relations avec les particuliers, tandis que le KYB garantit la légitimité des partenaires commerciaux. Tous les deux répondent aux normes AML (Anti-Money Laundering). Technos communes: IA, blockchain, reconnaissance optique de caractères pour automatiser la vérification et détecter les anomalies.

## DEBRIEF CASE TECHNIQUE

### **Remarques sur mon traitement du case technique**
Concernant l'idempotence:
* La vérification de l'idempotence aurait dû être la toute première opération du process de création de l'ordre de conversion.
* J'ai utilisé la clé d'idempotence comme clé primaire de ma table `conversions`, ce n'est pas prudent. Cette clé représente l'intention du client de placer son opération de change. La clé primaire est un identifiant technique. Le client ne doit pas décider d'éléments techniques. Dans le cadre de ce test, ça n'a pas d'importance car on n'a qu'un seul client.

* La clé d'idempotence doit être un UUID ou un hash.
* Il y a un bug dans mon implémentation: l'ordre de conversion est créé même si la cotation est expirée.
* J'ai respecté l'idempotence vis-à-vis de ma BDD mais pas vis-à-vis du client. Le client reçoit une erreur si la cotation a été consommé ou est expiré. Il faudrait juste retourner l'ordre de conversion.
* Il faut s'assurer de la non-violation de la clé d'idempotence: que le client utilise la clé d'idempotence avec le même payload

Concernant la cotation:
* Dans la cotation, figer et persister la somme convertie (ne pas recalculer les sommes après la création de la cotation)
* Retirer l'appel au fournisseur de taux du process de création de la cotation: la latence fournisseur ne doit pas influencer la latence utilisateur

Concernant l'ordre de conversion
*  Il faut davantage de statuts internes: CREATED, SUBMITTING, SUBMITTED, UNKNOWN, ACCEPTED, PENDING, EXECUTED, REJECTED, FAILED_MANUAL_REVIEW
* Il faut un statut externe pour le client: CREATED, PENDING, EXECUTED, REJECTED. Ce statut externe permet de masquer la complexité des traitements internes.

* Il faut une table de transition stricte entre les états de l'ordre de conversion
| Etat source | Evènement | Etat cible |
| --- | --- | --- |
| CREATED | prise en charge worker soumission à la banque | SUBMITTING |
| SUBMITTING | rejet immédiat de la soumission | REJECTED |
| SUBMITTING | crash du worker | SUBMITTING |
| SUBMITTING | succès de la soumission | SUBMITTED |
| SUBMITTING | T/O ou erreur indéterminé | UNKNOWN |
| UNKNOWN | le partenaire a reçu le paiement (ACCEPTED via webhook/réconciliation) | ACCEPTED |
| UNKNOWN | le partenaire a reçu le paiement (REJECTED via webhook/réconciliation) | REJECTED |
| UNKNOWN | le partenaire a reçu le paiement (EXECUTED via webhook/ou réconciliation) | EXECUTED |
| SUBMITTED | le partenaire a pris en charge (ACCEPTED via webhook) | ACCEPTED |
| SUBMITTED | le partenaire a exécuté le paiement (EXECUTED via webhook) | EXECUTED |
| SUBMITTED | le partenaire a rejeté le paiement (REJECTED via webhook) | REJECTED |
| UNKNOWN | le partenaire n'a pas reçu le paiement (via la réconciliation) | SUBMITTING |
| ACCEPTED | le partenaire a rejeté le paiement (via la réconciliation) | REJECTED |
| ACCEPTED | le partenaire a exécuté le paiement (via la réconciliation) | EXECUTED |
| ACCEPTED | le paiement est en PENDING chez le partenaire (via la réconciliation) | PENDING |
| SUBMITTED | le paiement est en PENDING chez le partenaire (via la réconciliation) | PENDING |
| UNKNOWN | le paiement avait été reçu et est en PENDING chez le partenaire (via la réconciliation) | PENDING |
| SUBMITTING | 5 tentatives de soumission ou dans le même état depuis 2 jours | FAILED_MANUAL_REVIEW |
| UNKNOWN | 5 tentatives de soumission ou état constant depuis 2 jours | FAILED_MANUAL_REVIEW |
| PENDING | exécuté côté partenaire bancaire via webhook/reconciliation | EXECUTED |
| PENDING | rejeté côté partenaire via webhook/ reconciliation | REJECTED |
| PENDING | dans le même état depuis 2 jours | FAILED_MANUAL_REVIEW |
