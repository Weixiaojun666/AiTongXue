<?php

namespace app\controller;

use Exception;
use think\facade\Db;
use think\facade\Filesystem;

class Xjz
{
    public function Post()
    {
        try {
            $data = input('post.');
            Db::table('tb_xjz_content')->save($data);
            return (returnJson(msg: "成功"));
        }catch (Exception $e) {
            return (returnJson(1, $e->getMessage()));
        }
    }

    public function getList($page = 1, $limit = 10)
    {
        $user = checkLogin();
        if (!$user) return (returnJson(1, '无权限'));
        $data = Db::table('tb_xjz_content');
        $count = $data->count();
        $data = $data->page($page, $limit)->select();
        return (returnJson(0, 'success', $data, $count));
    }
    public function login()
    {
        //type 1学生 2教师 3管理员
        $data = input('post.');
        if (env('CAPTCHA_ON') && !captcha_check($data['captcha'])) {
            return (returnJson(1, '验证码错误'));
        }
        $user = Db::table('tb_xjz_user')->where(['username' => $data['username'], 'state' => 1])->find();
        if (!$user) {
            return (returnJson(1, msg: "用户不存在"));
        }
        if ($user['password'] != hash("sha256", $data['password'])) {
            return (returnJson(1, msg: "密码错误"));
        }
        if ($user['state'] != 1) {
            return (returnJson(1, msg: "用户已被禁用"));
        }
        $user = ["uid" => $user["id"], "username" => $user["username"]];
        Session('user', $user);
        return (returnJson(msg: "登陆成功"));
    }
    public function delete()
    {
        $user = checkLogin();
        if (!$user) return (returnJson(1, '无权限'));
        $id = input('post.id');
        try {
            Db::table('tb_xjz_content')->where('id', $id)->delete();
        } catch (Exception $e) {
            return (returnJson(1, $e->getMessage()));
        }
        return (returnJson(0, 'success'));
    }
    public function upload()
    {
        $file = request()->file('file');

        $saveName =  Filesystem::disk('public')->putFile( 'xjz', $file, 'md5');

        return (returnJson(0, 'success', $saveName));

    }
}