import ollama

def ask_ollama(context, question):
    prompt = f"""You are a helpful assistant. Use the following context to answer the question.\n\nContext:\n{context}\n\nQuestion: {question}"""
    response = ollama.chat(
        model='llama3',
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response['message']['content']

def load_knowledge(file_path):
    with open(file_path, 'r') as file:
        return file.read()

if __name__ == "__main__":
    context = load_knowledge("Gen AI/knowledge.txt")
    while True:
        q = input("Ask a question (or 'exit'): ")
        if q.lower() == 'exit':
            break
        answer = ask_ollama(context, q)
        print("Answer:", answer)
