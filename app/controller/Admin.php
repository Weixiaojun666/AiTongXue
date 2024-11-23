<?php

namespace app\controller;

use think\facade\Db;

class Admin
{
    public function getStudentList($page = 1, $limit = 10, $username = null, $state = 1)
    {
        $user = checkLogin();
        if (!($user['type'] == 3 || $user['type'] == 2)) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_user_student');
        //查询出班级名
        $data = $data->leftjoin('tb_class', 'tb_user_student.cid=tb_class.id')
            ->field('tb_user_student.*,tb_class.title as class_name');
        if ($username) {
            $data = $data->where('username', 'like', '%' . $username . '%');
        }

        $data = $data->where('state', $state);

        $count = $data->count();
        $data = $data->page($page, $limit)->select();

        return (returnJson(0, 'success', $data, $count));
    }

    //获取用户列表
    public function getUserList($page = 1, $limit = 10, $username = null)
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_user');
        if ($username) {
            $data = $data->where('username', 'like', '%' . $username . '%');
        }
        $count = $data->count();
        $data = $data->page($page, $limit)->select();
        return (returnJson(0, 'success', $data, $count));
    }

    //获取教师列表
    public function getTeacherList()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_user')->where(['type' => 2, "state" => 1]);
//        if ($username) {
//            $data = $data->where('username', 'like', '%' . $username . '%');
//        }
        //$count = $data->count();
        $data = $data->field("id,username")->select();
        return (returnJson(0, 'success', $data,));
    }

    //获取课程列表
    public function getSubjectList($page = 1, $limit = 10, $title = null)
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_record_subject');
        if ($title) {
            $data = $data->where('title', 'like', '%' . $title . '%');
        }
        $count = $data->count();
        $data = $data->page($page, $limit)->select();
        return (returnJson(0, 'success', $data, $count));
    }

    //获取上课记录
    public function getCourseList($page = 1, $limit = 10, $title = null)
    {
        $user = checkLogin();
        if ($user['type'] == 0) {
            return (returnJson(1, '无权限'));
        }
        if ($user['type'] == 2) {
            $data = Db::table('tb_record_course')->where('uid', $user['uid']);
        } else {
            $data = Db::table('tb_record_course');
        }
//        $data = Db::table('tb_record_course');
        if ($title) {
            $data = $data->where('title', 'like', '%' . $title . '%');
        }
        $count = $data->count();
        //同时查询出有多少学生参加了本次课程
        $data = $data->page($page, $limit)
            ->join('tb_record_subject', 'tb_record_course.sid=tb_record_subject.id')
            ->join('tb_user', 'tb_record_course.uid=tb_user.id')
            ->join('tb_record_course_student', 'tb_record_course.id=tb_record_course_student.cid')
            ->group('tb_record_course.id')
            ->field('tb_record_course.*,tb_record_subject.name,tb_user.username as username,count(tb_record_course_student.id) as student_count')
            ->select();
        return (returnJson(0, 'success', $data, $count));
    }

    //获取课程列表
    public function getCourse($page = 1, $limit = 10, $id = '')
    {
        $user = checkLogin();
        if ($user['type'] == 0) {
            $id = $user['uid'];
        }
//        if ($id == '') {
//            return (returnJson(1, '参数错误'));
//        }

        $data = Db::table('tb_course')->alias('tb_course')
            ->leftJoin('tb_subject s', 'tb_course.sid = s.id')
            ->leftJoin('tb_user u', 'tb_course.uid = u.id')
            ->leftJoin('tb_course_student cs', 'tb_course.id = cs.cid')
            ->leftJoin('tb_class c', 'tb_course.cid = c.id')
            ->group('tb_course.id')
            ->field('tb_course.id,tb_course.title,u.username,s.name,tb_course.start_time,tb_course.end_time,tb_course.effective_time,tb_course.expire_time,tb_course.week,c.title as class_name,count(cs.id) as student_count');

        $count = $data->count();
        $data = $data->page($page, $limit)
            ->select()->toArray();
        return (returnJson(0, 'success', $data, $count));
    }

    public function getClassList()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_class')->alias('tb_class')
            ->Join('tb_user u', 'tb_class.uid = u.id')
            ->leftJoin('tb_user_student us', 'tb_class.id = us.cid')
            ->leftJoin('tb_subject s', 'tb_class.sid = s.id')
            ->group('tb_class.id')
            ->field('tb_class.id,tb_class.title,u.username,count(us.id) as student_count,s.name,s.id as sid,u.id as uid');

        $count = $data->count();
        $data = $data->select()->toArray();
        return (returnJson(0, 'success', $data, $count));
    }

    public function getClassList0()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = Db::table('tb_class');

        $data = $data->field('id,title')->select();
        return (returnJson(0, 'success', $data));
    }


    public function getClassStudentList($id = '')
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data0 = Db::table('tb_user_student')
            ->leftjoin('tb_class', 'tb_user_student.cid=tb_class.id')
            ->field('tb_user_student.id as value,username as title,tb_class.title as t',)->where('tb_user_student.state', 1)->select()->toArray();
        //将班级名放到学生名前面 [班级名]学生名
        foreach ($data0 as $key => $value) {
            if ($value['t'] == null) {
                $value['t'] = '未分配班级';
            }
            $data0[$key]['title'] = '[' . $value['t'] . ']' . $value['title'];
        }

//        $data0 = array_column($data0, 'title', 'value');
        $data = Db::table('tb_user_student')->where('cid', $id)->field('id')->select()->toArray();
        //将data转成[1,2,3]形式
        $data = array_column($data, 'id');

        return (returnJson(0, 'success', $data, data0: $data0));
    }

    public function saveUser()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        $username = $data['username'];

        $data = [
            'username' => $username,
        ];
        if ($id) {
            $data = Db::table('tb_user')->where('id', $id)->update($data);
        } else {
            $data = Db::table('tb_user')->insert($data);
        }
        return (returnJson(0, 'success'));

    }

    public function deleteUser()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $id = input('post.id');
        $data = Db::table('tb_user')->where('id', $id)->find();
        if ($data['state'] == 0) {
            Db::table('tb_user')->where('id', $id)->update(['state' => 1]);
            return (returnJson(0, 'success'));
        }
        #$data = Db::table('tb_user')->where('id', $id)->delete();
        Db::table('tb_user')->where('id', $id)->update(['state' => 0]);
        return (returnJson(0, 'success'));
    }

    public function deleteCourse()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $id = input('post.id');
        Db::table('tb_course')->where('id', $id)->delete();
        Db::table('tb_course_student')->where('cid', $id)->delete();
        return (returnJson(0, 'success'));

    }

    public function getCourseStudentList($id = '')
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data0 = Db::table('tb_user_student')
            ->join('tb_class', 'tb_user_student.cid=tb_class.id')
            ->field('tb_user_student.id as value,username as title,tb_class.title as t',)->select()->toArray();
        //将班级名放到学生名前面 [班级名]学生名
        foreach ($data0 as $key => $value) {
            $data0[$key]['title'] = '[' . $value['t'] . ']' . $value['title'];
        }

        $data = Db::table('tb_course_student')->where('cid', $id)
            ->field('sid as id')->select()->toArray();
        $data = array_column($data, 'id');
        return (returnJson(0, 'success', $data, data0: $data0));
    }


    public function updateClassStudentList()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        $type = $data['type'];
        $value = $data['value'];
        foreach ($value as $v) {
            //添加是0 删除是1
            if ($type == 0) {
                $insertData = [];
                Db::table('tb_user_student')->where(["id" => $v])->update(['cid' => $id]);

            } else {
                Db::table('tb_user_student')->where(["id" => $v])->update(['cid' => 0]);
            }
        }
        return (returnJson(0, 'success'));
    }

    public function updateCourseStudentList()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        $type = $data['type'];
        $value = $data['value'];
        foreach ($value as $v) {
            //添加是0 删除是1
            if ($type == 0) {
                $insertData = [];
                Db::table('tb_course_student')->insert(['cid' => $id, 'sid' => $v]);
            } else {
                Db::table('tb_course_student')->where(["cid" => $id, "sid" => $v])->delete();
            }
        }
        return (returnJson(0, 'success'));
    }


    //删除学生
    public function deleteStudent()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $id = input('post.id');
        $data = Db::table('tb_user_student')->where('id', $id)->find();
        if ($data['state'] == 0) {
            Db::table('tb_user_student')->where('id', $id)->update(['state' => 1]);
            return (returnJson(0, 'success'));
        }
        #$data = Db::table('tb_user_student')->where('id', $id)->delete();
        Db::table('tb_user_student')->where('id', $id)->update(['state' => 0, 'cid' => 0]);
        return (returnJson(0, 'success'));
    }


    //保存学生
    public function saveStudent()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        if ($id) {
            $data = Db::table('tb_user_student')->where('id', $id)->save($data);
        } else {
             Db::table('tb_user_student')->insert(['username' => $data['username'],]);
        }
        return (returnJson(0, 'success'));
    }

    //保存班级
    public function saveClass()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        $title = $data['title'];
        $sid = $data['sid'];
        $uid = $data['uid'];
        $data = [
            'title' => $title,
            'sid' => $sid,
            'uid' => $uid,
        ];
        if ($id) {
            $data = Db::table('tb_class')->where('id', $id)->update($data);
        } else {
            $data = Db::table('tb_class')->insert($data);
        }
        return (returnJson(0, 'success'));
    }

    //保存课程
    public function saveCourse()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        $id = $data['id'];
        $title = $data['title'];
        $sid = $data['sid'];
        $uid = $data['uid'];
//        $cid = $data['cid'];
        $week = $data['week'];

        $start_time = $data['start_time'];
        $end_time = $data['end_time'];
        $effective_time = $data['effective_time'];
        $expire_time = $data['expire_time'];

//        preg_match('/(\d+)时(\d+)分/', $start_time, $matches);
//        $start_time = date('H:i:s', $matches[1] * 3600 + $matches[2] * 60 - 8 * 3600);
//        $end_time = $data['end_time'];
//        preg_match('/(\d+)时(\d+)分/', $end_time, $matches);
//        $end_time = date('H:i:s', $matches[1] * 3600 + $matches[2] * 60 - 8 * 3600);

        $data = [
            'title' => $title,
            'sid' => $sid,
            'uid' => $uid,
//            'cid' => $cid,
            'start_time' => $start_time,
            'end_time' => $end_time,
            'effective_time' => $effective_time,
            'expire_time' => $expire_time,
            'week' => $week,
        ];

        if ($id) {
            $data = Db::table('tb_course')->where('id', $id)->update($data);
        } else {
            $data = Db::table('tb_course')->insert($data);
        }
        return (returnJson(0, 'success'));
    }


}