********** IGNORE THIS DOCUMENT FOR NOW **********


# Project Readiness Page

## Overview
this page is an evaluation of the project's readiness for production. It provides a high-level overview of the project's status. 

## What is the readines analysis
this is based on the info in the collecitons.
we will have a readiness colleciton.

### the core departments
We have the departments collection with followin fields:
coreDepartment: boolean; // this is set to true for core departments.
gatherCheck: boolean; // this is set to true for departments that are part of the gather process.
codeDepNumber: number; // this is the order of the department in the production process.

### projectReadiness Collection
we will create a new collection called project-readiness in payloadcms.
this will have the following min fields:
1) projectId: string; // this is the project id
2) departmentId: string; // this is the department id
3) evaluationResult: string; // this is the result of the evaluation
4) rating: number; // this is the rating of the evaluation
5) readinessScore: number; // this is the readiness score of the project. between 0 and 100.

## Pageload

the page load will check if we have all the core departments. 
if not, it will show a message that the project is not ready for production. 

if we have all the core departments
it will display the cored departments in the asc order of codeDepNumber

the display will be cards.

the cards will display the readiness score 
it will have the name of the department and the evaluation result in a collapsible section. The min threshold for the readiness score will be provided in the department settings and displayed for ref.
there will be a button to start the evaluation.
the button will be disabled if the evaluation is in progress. There will be loading state and progress bar.
the button will be enabled if the evaluation is not in progress and the department evalauation of the last department is more than the threshold provided in the department settings. Essentially we build on information.


The page will have the sub header explaning the purpose of the page:
1) This page will help you ready the project for production. There are [x] lines of information available for processing. the x is the number of lines in the gather database for this project.
2) You can provide all the information you want via the chat.
3) when you feel that enough information has been provided, you can run the evaluation.

## Evaluation

This is the process that runs when the evaluate button is pressed.
essentially all the information from the gather db is provided to the master orchestrator. 
the master orchestrator will then route it to the relevant departments.
the departments will then evaluate the information and provide a rating.
the rating will be saved in the project-readiness collection.
the master orchestrator will then aggregate the ratings and provide a readiness score.  
the readiness results with the resulting content will be saved in the project-readiness collection.

## Purpose
the purpose of this page is to provide a high-level overview of the project's readiness for production. 
It allows to seed the project data for the video generation pipeline. on which the ai will then generate the video.
