import os
from matplotlib.pyplot import text
import spacy
from spacy.tokens import DocBin

#converting the train folder into to train.spacy and dev.spacy for traing and validation respectively
def Divider(data_directory,split):
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
    split = int(len(reviews) * split)
    return reviews[:split],reviews[split:] 

#fromatting the data in json for textcategorizer
def JsonFormater(data):
    text, label = zip(*data)
    for i in range(len(data)):
        yield{
            "text": text[i],
            "labels": label[i]
        }

#assigning categories for each text   
def record_conversion(nlp,record,categories):
    doc = nlp.make_doc(record["text"])
    doc.cats = {category: 0 for category in categories}
    for label in record["labels"]:
        doc.cats[categories[int(label)]] = 1
    return doc

#taking reviews from the directory
data_directory: str = r"./reviews/train"
nlp = nlp = spacy.blank("en")
train,test = Divider(data_directory,0.8)
records = JsonFormater(train)
categories = ["neg","pos"]
docs = [record_conversion(nlp, record, categories) for record in records]
db = DocBin(docs=docs).to_disk("./train.spacy")
test_records = JsonFormater(test)
docs.clear()
docs = [record_conversion(nlp, record, categories) for record in test_records]
da = DocBin(docs=docs).to_disk("./dev.spacy")