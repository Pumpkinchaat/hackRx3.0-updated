import os
from matplotlib.pyplot import text
import spacy
from spacy.tokens import DocBin

#code for converting the test folder to spacy format inorder to evaluate the performence of the trained model

def Divider(data_directory):
    reviews = []
    for label in ["pos", "neg"]:
        labeled_directory = f"{data_directory}\\{label}"
        for review in os.listdir(labeled_directory):
            if review.endswith(".txt"):
                with open(f"{labeled_directory}\\{review}", encoding='cp437') as f:
                    text = f.read()
                    text = text.replace("<br />", "\n\n")
                    if text.strip():                      
                        if label == "pos":                
                            ans = "1"
                        else:
                            ans = "0"
                        reviews.append((text,ans))
    return reviews

def JsonFormater(data):
    text, label = zip(*data)
    for i in range(len(data)):
        yield{
            "text": text[i],
            "labels": label[i]
        }
    
def record_conversion(nlp,record,categories):
    doc = nlp.make_doc(record["text"])
    doc.cats = {category: 0 for category in categories}
    for label in record["labels"]:
        doc.cats[categories[int(label)]] = 1
    return doc


data_directory: str = r"./reviews/test"
nlp = nlp = spacy.blank("en")
test = Divider(data_directory)
records = JsonFormater(test)
categories = ["neg","pos"]
docs = [record_conversion(nlp, record, categories) for record in records]
db = DocBin(docs=docs).to_disk("./test.spacy")