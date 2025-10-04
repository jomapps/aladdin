# Moondream2

> Moondream2 is a highly efficient open-source vision language model that combines powerful image understanding capabilities with a remarkably small footprint.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/moondream2/visual-query`
- **Model ID**: `fal-ai/moondream2/visual-query`
- **Category**: vision
- **Kind**: inference
**Tags**: Vision



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`image_url`** (`string`, _required_):
  URL of the image to be processed
  - Examples: "https://llava-vl.github.io/static/images/monalisa.jpg"

- **`prompt`** (`string`, _required_):
  Query to be asked in the image



**Required Parameters Example**:

```json
{
  "image_url": "https://llava-vl.github.io/static/images/monalisa.jpg",
  "prompt": ""
}
```


### Output Schema

The API returns the following output format:

- **`output`** (`string`, _required_):
  Output for the given query



**Example Response**:

```json
{
  "output": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/moondream2/visual-query \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "image_url": "https://llava-vl.github.io/static/images/monalisa.jpg",
     "prompt": ""
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/moondream2/visual-query",
    arguments={
        "image_url": "https://llava-vl.github.io/static/images/monalisa.jpg",
        "prompt": ""
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/moondream2/visual-query", {
  input: {
    image_url: "https://llava-vl.github.io/static/images/monalisa.jpg",
    prompt: ""
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/moondream2/visual-query)
- [API Documentation](https://fal.ai/models/fal-ai/moondream2/visual-query/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/moondream2/visual-query)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)
Highlight connections
3 connections found
Actions
