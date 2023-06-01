from django.urls import path
import json
from ninja import NinjaAPI
from scan.receipt2TextModel import receiptToTextContent
import os

# from ninja import Router
from django.http import JsonResponse
from django.http import HttpRequest
api = NinjaAPI()


@api.post("/readReceipt")
def readReceipt(request: HttpRequest):
    try:
        if request.method == "POST":
            data = json.loads(request.body.decode("utf-8"))
            filepath = data.get("filepath")
            # print("filepath", filepath)
            itemText = receiptToTextContent(os.path.join("../", filepath))
            #print("itemText",itemText)
            response_data = {"data": itemText}
            return JsonResponse(response_data, status=200)
        else:
            error_msg ={"error": "sever error"}
            return JsonResponse(error_msg, status=500)
    except Exception as e:
        print(e)
        error_msg ={"error": "sever error"}
        return JsonResponse(error_msg, status=500)


urlpatterns = [
    path("", readReceipt)
]
