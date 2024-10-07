<?php
// 应用公共文件
use think\facade\Session;

function returnJson($code = '', $msg = '', $data = '', $count = '', $data0 = '')
{
    header('Content-Type:application/json; charset=utf-8');
    if ($code == '') {
        $code = 0;
    }
    $result = [
        'code' => $code,
        'msg' => $msg,
        'data' => $data,
    ];
    if ($count != '') {
        $result = [
            'code' => $code,
            'msg' => $msg,
            'data' => $data,
            'count' => $count
        ];
    }
    if ($data0 != '') {
        $result = [
            'code' => $code,
            'msg' => $msg,
            'data' => $data,
            'data0' => $data0
        ];
    }
    return json($result);
}

function checkLogin()
{
    $user = Session::get('user');
    if (!$user) {
        header('Content-Type:application/json; charset=utf-8');
        exit(returnJson(-1, '未登录')->getContent());
    }
    return $user;
}