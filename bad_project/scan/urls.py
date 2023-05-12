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
    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))
        filepath = data.get("filepath")
        # print("filepath", filepath)
        itemText = receiptToTextContent("../"+filepath)
        #print("itemText",itemText)
        response_data = {"data": itemText}
        return JsonResponse(response_data, status=200)
    else:
        return JsonResponse("error",status=404)


urlpatterns = [
    path("", readReceipt)
]
