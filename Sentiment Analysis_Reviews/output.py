import spacy
import sys

#loads the trained model and calculates the score and outputs the rating for the review 

loadedmodel = spacy.load(sys.argv[2])
parsed_text = loadedmodel(sys.argv[1])
if parsed_text.cats["pos"] > parsed_text.cats["neg"]:
    score = parsed_text.cats["pos"]
    rating = round((2.5*((score - 0.5)/(0.5)) + 2.5)*10)/10
else:
    score = parsed_text.cats["neg"]
    rating = round((2.5*((0.5 - score)/(0.5)) + 2.5)*10)/10
print(rating)