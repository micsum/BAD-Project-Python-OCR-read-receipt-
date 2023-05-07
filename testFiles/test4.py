import easyocr
import cv2

reader = easyocr.Reader(['ch_tra', 'en'])

img = cv2.imread('../uploads/attachment/8b8f50beaadf1f2521c024d07.jpeg')
result = reader.readtext(img, detail=0)

print(result)