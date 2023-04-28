import cv2
import easyocr
import pytesseract as pyt
from PIL import Image

validPriceTagElementsString = ".$-"

def checkDollarSignExistence(item):
    return (item.rfind('$') == 0 or item.rfind('$') == 1)

def checkDollarSignDuplicate(item, index, list):
    if checkDollarSignExistence(item) and index != 0:
        if not checkDollarSignExistence(list[index-1]):
            return True
    return False

def stringIsPriceTag(item):
    if checkDollarSignExistence(item):
        return True
    elif len(item) < 3:
        return False
    elif item[-3] == ".":
        return True
    else:
        return False

def elemIsPriceTagElem(elem):
    return (elem.isdigit() or validPriceTagElementsString.rfind(elem) != -1)

def findValidString(globalIndex, localIndex, list):
    item = ""
    defaultItem = list[globalIndex-localIndex]
    if globalIndex - localIndex < 0:
        item = ""
    elif checkDollarSignExistence(defaultItem):
        item = ""
    elif str(defaultItem).isascii():
        localIndex += 1
        item = findValidString(globalIndex, localIndex, list)
    else:
        item = defaultItem
    return item

def findNonPriceTagString(index, list):
    if index >= len(list):
        return False
    elif checkDollarSignExistence(list[index]):
        return False
    else: 
        return True

def receiptToTextContent(imagePath):
    pytPriceTagList = []
    resultArray = []

    custom_config = r'--oem 1 --psm 6'
    pytResult = pyt.image_to_string(Image.open(imagePath), lang='chi_tra', config = custom_config)
    pytResult = pytResult.rsplit("\n")
    
    pytResultText = ""
    for string in pytResult:
        pytResultText += " " + string
    pytResult = pytResultText.rsplit(" ")

    for string in pytResult:
        if (stringIsPriceTag(string)):
            priceTag = ""
            for char in string:
                if elemIsPriceTagElem(char):
                    priceTag += char
            pytPriceTagList.append(priceTag)
    print(f"pyt Result List : {pytPriceTagList}")

    ocrReader = easyocr.Reader(['ch_tra', 'en'])
    image = cv2.imread(imagePath)
    ocrResultList = ocrReader.readtext(image, detail = 0)

    for index in range(len(ocrResultList)):
        itemInfo = [[],[]]
        listElem = ocrResultList[index]

        if(checkDollarSignDuplicate(listElem, index, ocrResultList)):
            for char in listElem:
                if not elemIsPriceTagElem(char):
                    listElem = pytPriceTagList[len(resultArray)]
                    break
            itemInfo[1].append(listElem)
        
            itemNameElem = findValidString(index, 1, ocrResultList)
            itemInfo[0].append(itemNameElem)

            secondaryIndex = 0
            while(findNonPriceTagString(index+secondaryIndex+2, ocrResultList)):
                stringInCheck = ocrResultList[index+secondaryIndex+1]
                if not (str(stringInCheck).isascii() or checkDollarSignExistence(stringInCheck)) and stringInCheck.rfind("餐具") == -1 and stringInCheck.rfind("飲管") == -1:
                    itemInfo[0].append(stringInCheck)
                else:
                    break
                secondaryIndex += 1
            resultArray.append(itemInfo)
    return resultArray

finalArray = receiptToTextContent("./testFiles/testPhotos/cropped03.png")
print(finalArray)
