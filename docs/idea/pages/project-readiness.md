********** IGNORE THIS DOCUMENT FOR NOW **********


# Project Readiness Page

## Overview
this page is an evaluation of the project's readiness for production. It provides a high-level overview of the project's status. 

## What is the readines analysis
We have departments collection.
it will have a set of core departments that are required for the project to be considered ready for production. 
it can have any number of departments.
There are departments called core departments. This is ali list that hast o be present in collecitons for this page. If we dont have all the core departments, the project is not ready for production.
If this field is set to true, it means that the department is a core department. 
Further we we have a field called gatherCheck which will be false by default.

## Pageload
on pageload the page will check if we have all the core departments. if not, it will show a message that the project is not ready for production. further it will check any readiness analysis that has been done. and show the cards. it will be from project-readinesscollection called

## gatherCheck
the aim of this gatherCheck is to list all departments that will be analyzing gather data and rate it for complemteness, from their angle. You can query the brain as this is unstructured data that is being saved in the gather database structure read gather.md for more details.

## Purpose
show all the departments that have gatherCheck set to true. each one has a card.
put a analyze button.
When pressed, each department head will be asked to analyze the gather data and rate it for completness, from their angle.
this information will be saved in a new collection called project-readiness in payloadcms. in the database and shown in the card.
during analysis, which can be parallel, there will be animation and progress bars.
the result will be a percentage of completeness and a score. 

that is all this page does. it allows the user to see the status of the project from different angles. and take action if needed.

## Improve Content

There will a button on every card that says "Improve Content". When pressed, it will take the current content and improve it.
it can use the context of the whole project to improve the content. it can also consult the brain.
This is not the final content. this is the pre-cursor to the final content.

The question being anserd here is: Do i have enough information to start creating high quality information.
- an bad example would be:
story: dog bites man
- another bad eample would be:
story: A dog bites a man in the park. The man is bleeding. The dog is growling. The man is screaming.
why this is bad is because it is a scene, not a story.
- good story example:
story: A young boy named Timmy discovers a hidden world of magic and adventure in his backyard.
good because it is a story / seed for a story

 you will need to create a full story from this info !!!

 improvement data will be saved back in the mongodb (still not in payloadcms), given to the department head for review and final approval, rated and saved in the gather brain (brain with project context which is the gather database). the rating goes not the project-readiness collection in paylaod.

 ## important
 = this has nothing to do with payloadcms except deparments and project-readiness collection.
 - the improved data will be saved back in the mongodb, but not in payloadcms. only the rating will be saved in payloadcms.

 ## Produce with this state
 this is the key automation feature of actually producing the filem.
 it will be disabled by default. it wil enable with story rating of 60% and aboeve
 When pressed, it will do different things tbd in future but for now, just alert, the production process has started.


1. as you suggested.
2. A. remember, we need coreDepartment and gatherCheck
3. procedure is same, and the department head can a back and forth with the brain if required.  You can give the context and ask - is this enough to build a story. Since we dont know what we have, we cannot be precise. 
4. brain is using read and write, we have reached the isolation with aladdin-gather-{projectId} MongoDB. Brain is a query system and it is exposed via our api. mongodb is locally present data. so there is no such things as mongo thru brain. brain allows symantic searcha dn querying. where as mongodb will hold the raw records.
5. save to a new/update record in mongdb gather db. the deoartment name will be the collection name. it will have only one record max. and only 1 field called "evaluationResult", you can make it enhanced if you like.
step 2: there needs to be a prompt for that, please create a field in payloadcms>department>gatherImprovementPrompt and that will be used to improve.
step3: earlier in this description
step4: background taks. user jsut waits. 
step5: rating in percentage. improved creates a new improved output in the 

6. if you are unsure 