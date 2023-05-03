from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.


def index(request):
    return render(request,'/Users/mic/Desktop/Tecky/BAD/BAD-Project/testFiles/testCrop/crop.html')
