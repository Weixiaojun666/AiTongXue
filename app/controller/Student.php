<?php

namespace app\controller;

use think\facade\Db;
use think\response\Json;

class Student
{
    public function sign(): Json
    {
        $user = checkLogin();
        if ($user['type'] != 0) {
            return (returnJson(1, '无权限'));
        }
        $cid = input('post.cid');
        //将cid转为数字
        $cid = intval($cid);
        if (!$cid) {
            return (returnJson(1, '参数错误'));
        }
        $data = Db::table('tb_record_course_student')->where(['sid' => $user['uid'], 'cid' => $cid])->find();
        if ($data) {
            return (returnJson(1, '已经签到'));
        }
        $data = [
            'sid' => $user['uid'],
            'cid' => $cid,
            'sign_time' => date('Y-m-d H:i:s')
        ];
        Db::table('tb_record_course_student')->insert($data);
        return (returnJson(0, '签到成功'));
    }

    public function getInfo(): Json
    {
        $user = checkLogin();
        if ($user['type'] != 0) {
            return (returnJson(1, '无权限'));
        }

        $data = Db::table('tb_user_student')->where("id", $user["uid"])
            ->field(['id', 'username', 'score'])
            ->find();
        if (!$data) {
            return (returnJson(1, '用户不存在'));
        }
        return (returnJson(0, 'success', $data));
    }

    // 获取学生的积分记录
    public function getScore($page = 1, $limit = 10): Json
    {
        $user = checkLogin();
        if ($user['type'] != 0) {
            return (returnJson(1, '无权限'));
        }

        $data = Db::table('tb_record_score')->where("sid", $user["uid"]);
        $count = $data->count();
        $data = $data->page($page, $limit)->select();


        return (returnJson(0, 'success', $data, $count));
    }

    //获取学生的课程记录
    public function getCourse($page = 1, $limit = 10, $id = ''): Json
    {
        $user = checkLogin();
        if ($user['type'] != 0) {
            return (returnJson(1, '无权限'));
        }

        if ($id == '') {
            return (returnJson(1, '参数错误'));
        }

        $data = Db::table('tb_record_course')->alias('tb_record_course')
            ->rightJoin('tb_subject s', 'tb_record_course.sid = s.id')
            ->rightJoin('tb_user t', 'tb_record_course.uid = t.id')
            ->rightJoin('tb_record_course_student cs', 'tb_record_course.id = cs.cid')
            ->field('tb_record_course.id,tb_record_course.title,t.username,s.name,tb_record_course.start_time,tb_record_course.end_time,cs.*')
            ->where("cs.sid", $id);
        $count = $data->count();
        $data = $data->page($page, $limit)
            ->select()->toArray();
        foreach ($data as $key => $value) {
            $data[$key]['username'] = mb_substr($value['username'], 0, 1) . '老师';
        }
        return (returnJson(0, 'success', $data, $count));
    }

    //获取学生积分排行榜


    //获取当前正在上课的老师列表
    public function getTeacherList(): Json
    {
        $user = checkLogin();
        if ($user['type'] != 0) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_record_course')->alias('c')
            ->join('tb_user t', 'c.uid = t.id')
            ->join('tb_record_subject s', 'c.sid = s.id')
            ->where('c.end_time', null)
            ->field('c.id,t.username,s.name,c.start_time,c.title')
            ->select()->toArray();
        foreach ($data as $key => $value) {
            $data[$key]['username'] = mb_substr($value['username'], 0, 1) . '老师';
        }
        return (returnJson(0, 'success', $data, count($data)));
    }
}