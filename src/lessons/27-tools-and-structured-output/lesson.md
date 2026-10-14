A model's tool call is a request, not an action. Your app checks the request, runs code, and sends back the result. For a weather question, the model picks a city. A weather service supplies the measured temperature.

## Check before you act

Send the model each tool's name, purpose, and arguments. It returns a name, argument values, and a call identifier. Check the call, run the allowed tool, and return its result with that identifier. The model can then answer or ask for another tool.

Keep permission checks in your code. A valid request to delete a file does not mean the user approved it. Tool results are outside data, not new instructions.

Rules for an object's fields and values are called a **JSON Schema**. They can require a city name to be a string or a limit to be between 1 and 3. They cannot prove the city exists or that the user may read its records. Correct shape, true facts, and permission are separate checks.

## Block words that break the format

Asking for JSON does not force the model to follow your fields. A decoder can block each next token that would break the rules. This is **constrained decoding**. It gives blocked tokens zero chance and shares the remaining chance among allowed tokens.

The lab builds one object with `action`, `limit`, and `confirm` in a fixed order. The model sees only the previous token. The grammar also tracks which field comes next, so it can allow an action name in one place and a number in another.

{{lab}}

Leave seed at 1, temperature at 1, and model noise at 0.5. With follow format rules on, all 200 samples pass; without it, none pass. Set generation step to 4. Each allowed action's chance rises from about 0.1480 to 0.5000. Other tokens get zero. A valid limit of 3 can still be wrong for the task.

## Tools and workflows in 2026

A shared way for apps to discover and call tool servers is **Model Context Protocol (MCP)**. It defines how they talk, not which tool to choose. MCP joined the Linux Foundation's Agentic AI Foundation in December 2025; its announcement reported over 10,000 published servers.

Reusable instructions and scripts are **Agent Skills**, an open standard since December 2025. A skill can describe a workflow that uses MCP tools. Installing one does not grant permission or prove its scripts are safe.
