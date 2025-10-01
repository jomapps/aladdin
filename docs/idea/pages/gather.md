# Gather Page

This is the idea of the gather page.

## Overview
This describes the page gather and the raw information collection system.
This is the user interactive part where user can drop content, chat can create content and user can review and manage the content.

## Location 
Located at src\app\(frontend)\dashboard\project\[id]\gather
the layout should be there as always aka main-menu, left sidebar empty, right sidebar with ai-chat. 

## Visual
ui components will be displayed use shadcn components (ensure you import them if not present using hte correct pattern).

## Manu
link to this page will be added to the left sidebar. on all routes \project\[id]\*

## What this page does
this page will show collapsable list of cards. the card will simply have mongodb _id and date time stamps as heading - [_id] - last updated [datetime] in appropriate styling.
it will also show the summary of the content as tagline as subheading.  
the card will have a button to expand and show the content.
One should be able to edit the card and save it.
The card will also have a button to delete it.
if the content has image or document, it will be shown as well. in split 2 col inside the card


## how it works
To gather all the information that is provided* by the user and the ai agents.
the information will be saved as a json record in the isolated mongodb database (not payload cms)
the database will be created aladin-[project-id] if not present
it will have the gather collection
Each record in the gather collection will have the following structure:
```json
{
  _id: string, // mongodb _id
  projectId: string, // payload cms project id
  lastUpdated: string, // date time stamp
  content: string, // json stringified content
  imageUrl: string, // optional image url. this will be the cloudflare public url
  documentUrl: string, // optional document url. this will be the cloudflare public url
  summary: string, // ai generated summary of the content about 100 characters
  context: string, // ai generated context of the content
}
```

## Auto AI Processing
Whenever the content is added to the gather collection, it will be processed by ai to generate the summary and context.
the context is as detailed as it can be in context of the project.
Examples: the content can be a photo of the character or shot.

## AI Chat
The ai chat on the right sidebar will be able to create content based on the chat and requests. it can also just get content dropped in.
There has to be a button on the chat which says: "Add to Gather" which will add the content to the gather collection.

### Add to Gather
when the person says "Add to Gather"  and another button "Add all to gather"
when the user clicks "add to gather", the chat cards in the check get a selection checkbox. then the user can select multiple cards and click "add to gather"
when the user clicks "add all to gather", 
- a duplicate check goes thru all the gathered content and the chat cards and asks ai if there are any duplicates. if yes, it asks the user if they want to merge, skip or create new.
- the duplicate check will also check if there is any conflict in the information. E.g. character maya has been described as 25 in one place and 30 in another. the duplicate check will ask the user to resolve this conflict.
- all the resolutions are then applied to the data that will be saved.
- all the cards in chat are added to the gather collection.

ai will do this:
1) send the content to llm and ask it to evaluate if followup questions need to be asked. if yes ask and iterate upto 3 iterations.
2) Definitely ask the user what is the purpose of this content from the project and user point of view. This is not required.
2) generate the summary and context.
3) add the content to the gather collection.

Remember, following LLM keys are available to you in the llm prompt:
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit


## Special Terms marked *
Terms with an asterisk have special meaning

### Term: Provided
This means it is generated, result of a workflow, offered by ai chat, output from user
in the end it will always be text. the user can chat either drop content or ask the chat to create content.
if an image is provided :
- image will be uploaded to cloudflare r2 and the url will be stored in the imageUrl field
- it will be converted to text using vision llm, with key OPENROUTER_VISION_MODE in the env,to text
if a document is provided:
- document will be uploaded to cloudflare r2 and the url will be stored in the documentUrl field
- it will be converted to text using vision llm, with key OPENROUTER_VISION_MODE in the env,to text

## Important considerations
- This gather process is UNQUALIFIED Data. It is not to be used for any other purpose other than gathering and managing information.
- It has no connection to payload cms.
