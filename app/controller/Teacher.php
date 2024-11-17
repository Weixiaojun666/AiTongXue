<?php

namespace app\controller;

use Exception;
use think\facade\Db;

class Teacher
{

    public function getInfo()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return returnJson(1, '无权限');
        }
        $data = [
            'course' => [],
            'user' => $user,
            'student' => []
        ];
        //先检查tb_record_course中有没有正在进行的课程
        $result = Db::table('tb_record_course')->where('uid', $user['uid'])->where('state', 0)->find();
        if ($result) {
            $data['student'] = Db::table('tb_record_course_student')->where('tb_record_course_student.cid', $result['id'])
                ->alias('a')
                ->join('tb_user_student b', 'a.sid=b.id')
                ->field('a.*,b.username')
                ->select();
            $data = Db::table('tb_course')->where('start_time', '<=', date('H:i:s', time()))
                ->where('end_time', '>=', date('H:i:s', time()))
                ->where('week', date('w', time()))
                ->where('effective_time', '<=', date('Y-m-d', time()))
                ->where('expire_time', '>=', date('Y-m-d', time()))
                ->where(['uid'=> $user['uid'],'id'=>$result['cid']])
                ->find();
            if ($data == null) {
                //课程已经结束
                Db::table('tb_record_course')->where('id', $result['id'])->update(['state' => 1]);
                return returnJson(0, 'success', $data);
            }


            return returnJson(0, 'success', $data);
        }
        //检查当前时间是否有生效的课程
        $data = Db::table('tb_course')->where('start_time', '<=', date('H:i:s', time()))
            ->where('end_time', '>=', date('H:i:s', time()))
           ->where('week', date('w', time()))
            ->where('effective_time', '<=', date('Y-m-d', time()))
            ->where('expire_time', '>=', date('Y-m-d', time()))
            ->where('uid', $user['uid'])
            ->find();
        //如果有课程 复制一份到tb_record_course 并复制学生信息到tb_record_course_student
        if ($data) {
            $data0['cid'] = $data['id'];
            $data0['uid'] = $user['uid'];
            $data0['state'] = 0;
            $data0['id'] = Db::table('tb_record_course')->insertGetId($data0);
            $student = Db::table('tb_course_student')->where('cid', $data['id'])->select();
            foreach ($student as $key => $value) {
                $value['cid'] = $data0['id'];
                $value['id'] = null;
                Db::table('tb_record_course_student')->insert($value);
            }
            $data['student'] = Db::table('tb_record_course_student')->where('tb_record_course_student.cid', $data['id'])
                ->alias('a')
                ->join('tb_user_student b', 'a.sid=b.id')
                ->field('a.*,b.username')
                ->select();
            $data['course'] = Db::table('tb_course')->where('id', $data['cid'])->find();
            return returnJson(0, 'success', $data);
        }
        return returnJson(0, 'success', $data);
    }
    //获取课程列表
    public function getSubjectList()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return (returnJson(0, '无权限'));
        }
        $data = Db::table('tb_record_subject')->where("state", 1)->select();
        return returnJson(0, 'success', $data, count($data));
    }
    public function updateCourse()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return returnJson(1, '无权限');
        }
        $data = input('post.');
        $data['uid'] = $user['uid'];
        try {
            Db::table("tb_record_course")->where(["id"=>$data["id"],"uid"=>$user['uid']])->update($data);
        } catch (Exception $e) {
            return returnJson(1, '更新课程失败', $e->getMessage());
        }
        return returnJson(0, '更新课程信息成功');
    }


    public function submitStudentInfo()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            exit(returnJson(1, '无权限'));
        }
        $data = input('post.');

        $result = Db::table('tb_record_course_student')->where(['id'=>$data['id']])->find();
        if (!$result) {
            return returnJson(1, '未找到学生');
        }
        //判断cid是否属于这个教师
        $result = Db::table('tb_record_course')->where(['uid'=> $user['uid'],'id'=>$result['cid']])->find();
        if (!$result) {
            return returnJson(1, '未找到课程');
        }
        try {
            Db::table("tb_record_course_student")->where(["id" => $data['id']])->update([$data["key"] => $data['value']]);
        } catch (Exception $e) {
            return returnJson(1, '更新状态失败', $e->getMessage());
        }
        return returnJson(0, '更新状态成功');
    }
}