<?php

namespace app\controller;

use app\BaseController;

class Index extends BaseController
{
    public function index()
    {
        #重定向到/static/
        return redirect('/static/');
    }
}
